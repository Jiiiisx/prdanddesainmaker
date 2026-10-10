package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

var apiClient = &http.Client{
	Transport: &http.Transport{
		MaxIdleConns:        50,
		MaxIdleConnsPerHost: 20,
		IdleConnTimeout:     90 * time.Second,
	},
	Timeout: 120 * time.Second,
}

type visitor struct {
	tokens    int
	lastReset time.Time
}

type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	limit    int
	window   time.Duration
}

func newRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		limit:    limit,
		window:   window,
	}
	go rl.cleanupStale()
	return rl
}

func (rl *RateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	v, exists := rl.visitors[ip]
	if !exists || now.Sub(v.lastReset) > rl.window {
		rl.visitors[ip] = &visitor{tokens: 1, lastReset: now}
		return true
	}

	if v.tokens < rl.limit {
		v.tokens++
		return true
	}

	return false
}

func (rl *RateLimiter) cleanupStale() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for ip, v := range rl.visitors {
			if now.Sub(v.lastReset) > 2*rl.window {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func rateLimitMiddleware(rl *RateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr
			if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
				ip = strings.Split(forwarded, ",")[0]
			} else if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
				ip = realIP
			}

			if !rl.allow(strings.TrimSpace(ip)) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				_ = json.NewEncoder(w).Encode(map[string]string{
					"error": "Rate limit exceeded. Maksimal 30 request/menit.",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

type ClarificationTurn struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

type GenerateRequest struct {
	Idea           string              `json:"idea"`
	Model          string              `json:"model"`
	Language       string              `json:"language,omitempty"`
	Clarifications []ClarificationTurn `json:"clarifications,omitempty"`
}

type ClarifyInterviewRequest struct {
	Idea     string              `json:"idea"`
	History  []ClarificationTurn `json:"history,omitempty"`
	Model    string              `json:"model"`
	Language string              `json:"language,omitempty"`
}

type NextQuestion struct {
	Category         string   `json:"category,omitempty"`
	Question         string   `json:"question"`
	SuggestedOptions []string `json:"suggestedOptions"`
}

type ClarifyInterviewResponse struct {
	ReadinessScore int           `json:"readinessScore"`
	IsSufficient   bool          `json:"isSufficient"`
	AIObservation  string        `json:"aiObservation"`
	NextQuestion   *NextQuestion `json:"nextQuestion,omitempty"`
}

type RefineSectionRequest struct {
	SectionKey     string `json:"sectionKey"`
	CurrentContent string `json:"currentContent"`
	Instruction    string `json:"instruction"`
	Model          string `json:"model"`
	Language       string `json:"language,omitempty"`
}

type ModelInfo struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Provider  string `json:"provider"`
	Available bool   `json:"available"`
	Note      string `json:"note,omitempty"`
}

type ModelsResponse struct {
	Default             string      `json:"default"`
	RouterConfigured    bool        `json:"routerConfigured"`
	OpenAIConfigured    bool        `json:"openaiConfigured"`
	AnthropicConfigured bool        `json:"anthropicConfigured"`
	Models              []ModelInfo `json:"models"`
}

func getSystemPrompt(language string) string {
	langInstruction := "Write in Indonesian with standard international developer English terminology."
	if strings.EqualFold(language, "en") {
		langInstruction = "Write strictly in crisp, high-caliber English following Silicon Valley engineering standards."
	}

	return fmt.Sprintf(`You are a World-Class Principal Product Architect and Design Engineer (ex-Stripe, Linear, Apple design standard).
Your goal is to transform the user's raw idea into an elite-grade, execution-ready Product Requirements Document (PRD) and High-Vibe Design Brief.

Tone: Crisp, opinionated, highly technical, visually rich, and tailored strictly to the specific domain of the user's idea (NEVER use generic placeholder buzzwords). %s

CRITICAL: You MUST partition your output strictly into 5 sections using the EXACT delimiters below. Do not omit any delimiters.

<<<SECTION_SUMMARY>>>
# Executive Summary & Strategic Objectives
## 1. Problem Statement & Root Cause
(Sharp breakdown of existing friction, inefficiency, and why status-quo solutions fail in this specific niche)
## 2. Core Value Proposition & Unfair Advantage
(What makes this product uniquely 10x better and delightful to use)
## 3. Target User Personas & Pain Scenarios
- **Primary Persona (e.g. Persona Name, Role)**: Context, workflow trigger, and primary frustration.
- **Secondary Persona**: Context and expected outcome.

<<<SECTION_FEATURES>>>
# Core Features & Execution Scope
## MVP Requirements (P0 - Non-Negotiable)
- [ ] **Feature Name**: Acceptance criteria with clear validation and edge cases.
- [ ] **Feature Name**: Acceptance criteria with clear validation and edge cases.
- [ ] **Feature Name**: Acceptance criteria with clear validation and edge cases.
- [ ] **Feature Name**: Acceptance criteria with clear validation and edge cases.
## Nice-to-Have (P1 / Fast Follow)
- High-leverage features deferred post-launch with rationale.
## Non-Functional & Reliability Constraints
- **Performance Budget**: Target First Meaningful Paint, Interaction to Next Paint (INP), and API latency (<200ms).
- **Concurrency & Resilience**: Distributed lock, idempotent requests, and offline-first/fallback behavior.

<<<SECTION_TECH>>>
# Technical Architecture & Engineering Blueprint
## Recommended Tech Stack & Rationale
- **Frontend**: Specific modern framework (e.g., Next.js 15 App Router / Vite React 19) + Tailwind CSS + State strategy.
- **Backend**: Pragmatic high-throughput runtime (e.g., Golang / Node.js Bun / FastAPI) + Communication layer (REST/SSE/gRPC).
- **Database & Cache**: Primary persistence + in-memory store for session/locking.
## Core Data Schema
`+"```typescript"+`
// Strict TypeScript domain entity models & relationships
`+"```"+`
## Core REST / API Endpoints
- `+"`METHOD /api/v1/...`"+` : Request payload summary, success response status, and error handling.

<<<SECTION_DESIGN>>>
# UI/UX Direction & Visual Design System
## Aesthetic & Design Vibe
(Choose a tailored aesthetic matching the industry: e.g. Minimalist Editorial, Dark Futuristic Terminal, Warm Japanese Artisanal, or Clean Simple Neobrutalism. Explain spacing, micro-interactions, and mood)
## Curated Color Tokens (HEX)
Provide 5-6 hex colors perfectly matching this vibe:
- Primary: #HEX (Role & psychological effect)
- Secondary: #HEX (Accent / Highlights)
- Background: #HEX (Ambient Canvas)
- Surface: #HEX (Cards & Panels)
- Text Primary: #HEX (Headings & Body)
- Text Muted: #HEX (Subtitles & borders)
## Key UI Components & Layout Architecture
- Detailed layout flow, component breakdown (Sticky Navigation, Hero layout, Grid sections, Empty states, and feedback toasts).

<<<SECTION_PROMPTS>>>
# Ready-to-Use Vibe-Coding Prompts
## v0.dev / Bolt.new / Cursor Mega-Prompt:
`+"```text"+`
Build a production-grade, highly aesthetic web application for [App Domain].
Tech Stack: React 19, Tailwind CSS, Lucide Icons, Framer Motion, and Radix UI / shadcn/ui.
Visual Direction: [Specific Theme, palette, typography, glassmorphism or editorial vibe].
Key Screens & Components:
1. Header: [Exact elements, navigation, action CTA]
2. Main Content Flow: [Exact layout, interactive controls, real-time widgets]
3. Interactive States: [Hover states, active badges, skeleton loaders, optimistic UI updates]
Code Quality: Clean component architecture, TypeScript types, accessible keyboard shortcuts, and responsive layout from mobile (375px) to desktop (1440px). Zero boilerplate, production-ready polish.
`+"```"+`

## Midjourney / Ideogram Design Prompt:
`+"```text"+`
High-fidelity modern UI/UX design showcase for [Product Concept], [Aesthetic Vibe], clean bento grid layout, subtle depth, elegant typography, award-winning Dribbble trending web app design, 8k resolution, crisp lighting --ar 16:9 --v 6.0
`+"```"+`

<<<SECTION_DONE>>>
`, langInstruction)
}

// loadDotEnv reads a local .env file if present and populates missing environment variables
func loadDotEnv(filepath string) {
	file, err := os.Open(filepath)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			k := strings.TrimSpace(parts[0])
			v := strings.TrimSpace(parts[1])
			// Strip optional quotes
			v = strings.Trim(v, `"'`)
			if os.Getenv(k) == "" {
				os.Setenv(k, v)
			}
		}
	}
}

func handleGetModels(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	routerBaseURL := os.Getenv("ROUTER_BASE_URL")
	routerKey := os.Getenv("ROUTER_API_KEY")
	openaiKey := os.Getenv("OPENAI_API_KEY")
	anthropicKey := os.Getenv("ANTHROPIC_API_KEY")

	routerOk := routerBaseURL != "" && routerKey != ""
	openaiOk := openaiKey != ""
	anthropicOk := anthropicKey != ""

	models := []ModelInfo{
		{
			ID:        "Utama",
			Name:      "Utama (9Router Gemini Pro Combo)",
			Provider:  "9router",
			Available: routerOk,
			Note:      "Model default optimal dengan kuota 9Router lokal",
		},
		{
			ID:        "claude-3-5-sonnet",
			Name:      "Claude 3.5 Sonnet",
			Provider:  "anthropic",
			Available: anthropicOk,
			Note: func() string {
				if anthropicOk {
					return "Direct Anthropic API"
				}
				if routerOk {
					return "Dialihkan via 9Router Combo"
				}
				return "Mode simulasi lokal"
			}(),
		},
		{
			ID:        "gpt-4o",
			Name:      "OpenAI GPT-4o",
			Provider:  "openai",
			Available: openaiOk,
			Note: func() string {
				if openaiOk {
					return "Direct OpenAI API"
				}
				if routerOk {
					return "Dialihkan via 9Router Combo"
				}
				return "Mode simulasi lokal"
			}(),
		},
		{
			ID:        "gpt-4o-mini",
			Name:      "OpenAI GPT-4o Mini",
			Provider:  "openai",
			Available: openaiOk,
			Note: func() string {
				if openaiOk {
					return "Direct OpenAI API"
				}
				if routerOk {
					return "Dialihkan via 9Router Combo"
				}
				return "Mode simulasi lokal"
			}(),
		},
	}

	resp := ModelsResponse{
		Default:             "Utama",
		RouterConfigured:    routerOk,
		OpenAIConfigured:    openaiOk,
		AnthropicConfigured: anthropicOk,
		Models:              models,
	}

	_ = json.NewEncoder(w).Encode(resp)
}

func main() {
	loadDotEnv(".env")

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	limiter := newRateLimiter(30, time.Minute)
	r.Use(rateLimitMiddleware(limiter))

	allowedOrigins := []string{
		"http://localhost:5173",
		"http://localhost:3000",
		"http://127.0.0.1:5173",
		"http://localhost:8080",
	}
	if envOrigin := os.Getenv("ALLOWED_ORIGIN"); envOrigin != "" {
		allowedOrigins = append(allowedOrigins, envOrigin)
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok", "app": "PRD & Design Brief Generator"})
	})

	r.Get("/api/models", handleGetModels)
	r.Post("/api/generate", handleGenerate)
	r.Post("/api/clarify-interview", handleClarifyInterview)
	r.Post("/api/refine-section", handleRefineSection)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server listening on port :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}

func handleGenerate(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Idea) == "" {
		http.Error(w, "Idea text is required", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	ctx, cancel := context.WithTimeout(r.Context(), 120*time.Second)
	defer cancel()

	routerBaseURL := os.Getenv("ROUTER_BASE_URL")
	routerKey := os.Getenv("ROUTER_API_KEY")
	routerModel := os.Getenv("ROUTER_MODEL")
	if routerModel == "" {
		routerModel = "Utama"
	}

	openaiKey := os.Getenv("OPENAI_API_KEY")
	anthropicKey := os.Getenv("ANTHROPIC_API_KEY")

	var err error
	activeProvider := "mock"
	effectiveModel := "local-simulation"

	// Priority 1: 9Router if requested model is Utama, or if 9Router credentials configured
	if routerBaseURL != "" && (strings.EqualFold(req.Model, "utama") || (req.Model == "" && openaiKey == "" && anthropicKey == "")) {
		targetModel := req.Model
		if targetModel == "" || strings.EqualFold(targetModel, "utama") {
			targetModel = routerModel
		}
		activeProvider = "9router"
		effectiveModel = targetModel
		sendMeta(w, flusher, activeProvider, req.Model, effectiveModel)
		err = streamOpenAICompatible(ctx, w, flusher, routerBaseURL, routerKey, targetModel, req)
	} else if anthropicKey != "" && strings.Contains(strings.ToLower(req.Model), "claude") {
		activeProvider = "anthropic"
		effectiveModel = "claude-3-5-sonnet"
		sendMeta(w, flusher, activeProvider, req.Model, effectiveModel)
		err = streamAnthropic(ctx, w, flusher, anthropicKey, req)
	} else if openaiKey != "" && strings.Contains(strings.ToLower(req.Model), "gpt") {
		activeProvider = "openai"
		effectiveModel = req.Model
		sendMeta(w, flusher, activeProvider, req.Model, effectiveModel)
		err = streamOpenAI(ctx, w, flusher, openaiKey, req)
	} else if routerBaseURL != "" {
		// Fallback to 9Router if available
		activeProvider = "9router"
		effectiveModel = routerModel
		sendMeta(w, flusher, activeProvider, req.Model, effectiveModel)
		err = streamOpenAICompatible(ctx, w, flusher, routerBaseURL, routerKey, routerModel, req)
	} else if anthropicKey != "" {
		activeProvider = "anthropic"
		effectiveModel = "claude-3-5-sonnet"
		sendMeta(w, flusher, activeProvider, req.Model, effectiveModel)
		err = streamAnthropic(ctx, w, flusher, anthropicKey, req)
	} else if openaiKey != "" {
		activeProvider = "openai"
		effectiveModel = "gpt-4o"
		sendMeta(w, flusher, activeProvider, req.Model, effectiveModel)
		err = streamOpenAI(ctx, w, flusher, openaiKey, req)
	} else {
		// Mock streaming mode when API keys are not supplied
		sendMeta(w, flusher, activeProvider, req.Model, effectiveModel)
		err = streamMockPRD(ctx, w, flusher, req)
	}

	if err != nil {
		log.Printf("Streaming ended with error: %v", err)
		sendSSE(w, flusher, "error", fmt.Sprintf(`{"error": %q}`, err.Error()))
		return
	}

	sendSSE(w, flusher, "done", `{"status":"completed"}`)
}

func sendSSE(w io.Writer, flusher http.Flusher, event string, data string) {
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, data)
	flusher.Flush()
}

func sendMeta(w io.Writer, flusher http.Flusher, provider, requestedModel, effectiveModel string) {
	metaJSON, _ := json.Marshal(map[string]string{
		"provider":       provider,
		"requestedModel": requestedModel,
		"effectiveModel": effectiveModel,
	})
	sendSSE(w, flusher, "meta", string(metaJSON))
}

func sendChunk(w io.Writer, flusher http.Flusher, chunk string) {
	payload, _ := json.Marshal(map[string]string{"chunk": chunk})
	fmt.Fprintf(w, "event: chunk\ndata: %s\n\n", payload)
	flusher.Flush()
}

func buildUserPrompt(req GenerateRequest) string {
	var sb strings.Builder
	sb.WriteString("Application Idea: " + req.Idea)
	if len(req.Clarifications) > 0 {
		sb.WriteString("\n\nArchitectural Decisions & Clarifications from User Interview:\n")
		for i, c := range req.Clarifications {
			sb.WriteString(fmt.Sprintf("%d. Question: %s\n   User's Decision: %s\n", i+1, c.Question, c.Answer))
		}
		sb.WriteString("\nIncorporate ALL of the above decisions tightly into the PRD and Design Brief specifications.\n")
	}
	return sb.String()
}

func streamOpenAICompatible(ctx context.Context, w io.Writer, flusher http.Flusher, baseURL string, apiKey string, modelName string, req GenerateRequest) error {
	baseURL = strings.TrimRight(baseURL, "/")
	endpoint := baseURL + "/chat/completions"

	userPrompt := buildUserPrompt(req)
	payload := map[string]interface{}{
		"model": modelName,
		"messages": []map[string]string{
			{"role": "system", "content": getSystemPrompt(req.Language)},
			{"role": "user", "content": userPrompt},
		},
		"stream": true,
	}
	bodyBytes, _ := json.Marshal(payload)

	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	if apiKey != "" {
		httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := apiClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("router API error %d: %s", resp.StatusCode, string(b))
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if strings.TrimSpace(data) == "[DONE]" {
			break
		}

		var chunkObj struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if err := json.Unmarshal([]byte(data), &chunkObj); err == nil && len(chunkObj.Choices) > 0 {
			token := chunkObj.Choices[0].Delta.Content
			if token != "" {
				sendChunk(w, flusher, token)
			}
		}
	}
	return scanner.Err()
}

func streamOpenAI(ctx context.Context, w io.Writer, flusher http.Flusher, apiKey string, req GenerateRequest) error {
	modelName := "gpt-4o"
	if strings.Contains(strings.ToLower(req.Model), "mini") {
		modelName = "gpt-4o-mini"
	}

	payload := map[string]interface{}{
		"model": modelName,
		"messages": []map[string]string{
			{"role": "system", "content": getSystemPrompt(req.Language)},
			{"role": "user", "content": "Application Idea: " + req.Idea},
		},
		"stream": true,
	}
	bodyBytes, _ := json.Marshal(payload)

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := apiClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("openai error %d: %s", resp.StatusCode, string(b))
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if strings.TrimSpace(data) == "[DONE]" {
			break
		}

		var chunkObj struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if err := json.Unmarshal([]byte(data), &chunkObj); err == nil && len(chunkObj.Choices) > 0 {
			token := chunkObj.Choices[0].Delta.Content
			if token != "" {
				sendChunk(w, flusher, token)
			}
		}
	}
	return scanner.Err()
}

func streamAnthropic(ctx context.Context, w io.Writer, flusher http.Flusher, apiKey string, req GenerateRequest) error {
	modelName := "claude-3-5-sonnet-20241022"

	payload := map[string]interface{}{
		"model":      modelName,
		"max_tokens": 4096,
		"system":     getSystemPrompt(req.Language),
		"messages": []map[string]string{
			{"role": "user", "content": "Application Idea: " + req.Idea},
		},
		"stream": true,
	}
	bodyBytes, _ := json.Marshal(payload)

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	httpReq.Header.Set("x-api-key", apiKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := apiClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("anthropic error %d: %s", resp.StatusCode, string(b))
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")

		var eventObj struct {
			Type  string `json:"type"`
			Delta struct {
				Text string `json:"text"`
			} `json:"delta"`
		}
		if err := json.Unmarshal([]byte(data), &eventObj); err == nil {
			if eventObj.Type == "content_block_delta" && eventObj.Delta.Text != "" {
				sendChunk(w, flusher, eventObj.Delta.Text)
			}
		}
	}
	return scanner.Err()
}

func streamMockPRD(ctx context.Context, w io.Writer, flusher http.Flusher, req GenerateRequest) error {
	title := req.Idea
	if len(title) > 40 {
		title = title[:40] + "..."
	}

	mockContent := []string{
		"<<<SECTION_SUMMARY>>>\n",
		"# Executive Summary & Objectives\n\n",
		"## Problem Statement\n",
		fmt.Sprintf("Users currently lack a unified, fluid workspace for '%s'. Existing tools are fragmented, clunky, and create cognitive overhead for teams trying to execute fast.\n\n", title),
		"## Solution & Value Proposition\n",
		"A modern, responsive platform featuring real-time collaboration, intuitive bento grid dashboards, and instant AI-assisted workflows to accelerate execution by 5x.\n\n",
		"## Target Users\n",
		"- **Product Builders & Tech Leads:** Need quick, deterministic specifications.\n",
		"- **Engineers & Designers:** Demand crisp technical schemas and copy-ready UI design tokens.\n\n",

		"<<<SECTION_FEATURES>>>\n",
		"# Core Features & Scope\n\n",
		"## MVP Requirements (P0)\n",
		"- [x] **Quick Idea Onboarding:** Progressive disclosure input with category suggestions.\n",
		"- [x] **Dynamic Bento Dashboard:** Modular card layout that adapts smoothly to user actions.\n",
		"- [x] **SSE Streaming Pipeline:** Low-latency server-sent events for real-time document rendering.\n",
		"- [x] **Export & Clipboard Suite:** 1-Click markdown export and single-card copy utilities.\n\n",
		"## Nice-to-Have (P1 / Post-MVP)\n",
		"- Cloud workspace persistence and revision history.\n",
		"- Team collaboration comments directly on individual bento cards.\n\n",
		"## Non-Functional Requirements\n",
		"- **Latency:** Sub-100ms UI interaction responsiveness.\n",
		"- **Accessibility:** WCAG AA contrast ratio compliance with high-readability neobrutalism.\n\n",

		"<<<SECTION_TECH>>>\n",
		"# Technical Architecture & API\n\n",
		"## Recommended Tech Stack\n",
		"- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion\n",
		"- **Backend:** Golang (Chi Router) with Server-Sent Events (SSE) `http.Flusher`\n",
		"- **Database:** PostgreSQL for transactional data + Redis for cache/pub-sub\n\n",
		"## Core Data Schema\n",
		"```typescript\n",
		"interface ProjectSpec {\n",
		"  id: string;\n",
		"  title: string;\n",
		"  rawIdea: string;\n",
		"  sections: {\n",
		"    summary: string;\n",
		"    features: string[];\n",
		"    architecture: TechStackConfig;\n",
		"  };\n",
		"  createdAt: string;\n",
		"}\n",
		"```\n\n",
		"## Core REST API Endpoints\n",
		"- `POST /api/generate` - Streams generated PRD sections via Server-Sent Events.\n",
		"- `GET /api/health` - Health check and runtime status report.\n\n",

		"<<<SECTION_DESIGN>>>\n",
		"# UI/UX Direction & Visual Brief\n\n",
		"## Aesthetic & Vibe\n",
		"Modern **Simple Neobrutalism** (Clean Indigo & Architectural Paper Cream). Crisp solid borders, tactile drop shadows, and responsive bento grid structure.\n\n",
		"## Color Palette Tokens\n",
		"- Primary Accent: #4F46E5 (Indigo 600 - Main Actions)\n",
		"- Secondary Accent: #0EA5E9 (Sky 500 - Highlights)\n",
		"- Canvas Background: #F6F3EE (Warm Paper Cream Base)\n",
		"- Card Surface: #FFFFFF (Clean Solid Cards with 2px Border)\n",
		"- High Contrast Text: #18181B (Zinc 900 - Headings & Body)\n\n",
		"## Information Architecture\n",
		"- Screen 1: Centered Hero Prompt with Quick Suggestion Badges.\n",
		"- Screen 2: Dynamic 12-column Bento Grid with adaptive card expansions.\n\n",

		"<<<SECTION_PROMPTS>>>\n",
		"# Ready-to-Use AI Prompts\n\n",
		"## v0.dev / Bolt.new Prompt\n",
		"```text\n",
		fmt.Sprintf("Build a responsive web application for '%s' using React, Tailwind CSS, and Framer Motion. Use a simple neobrutalism aesthetic with crisp solid borders, warm cream paper canvas, tactile drop shadows, and modular bento grid cards.", title),
		"\n```\n\n",
		"## Midjourney / Image Prompt\n",
		"```text\n",
		fmt.Sprintf("Modern high-end web app dashboard for %s, modular bento grid interface, clean neobrutalism cards, architectural cream lighting, clean typography, UI/UX masterpiece, Figma community showcase, 8k --ar 16:9", title),
		"\n```\n\n",

		"<<<SECTION_DONE>>>\n",
	}

	for _, token := range mockContent {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}
		sendChunk(w, flusher, token)
		time.Sleep(35 * time.Millisecond) // realistic streaming pace
	}

	return nil
}

// handleClarifyInterview drives the dynamic, non-template interrogation phase
func handleClarifyInterview(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req ClarifyInterviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid payload"}`, http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Idea) == "" {
		http.Error(w, `{"error":"Idea is required"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 45*time.Second)
	defer cancel()

	routerBaseURL := os.Getenv("ROUTER_BASE_URL")
	routerKey := os.Getenv("ROUTER_API_KEY")
	routerModel := os.Getenv("ROUTER_MODEL")
	if routerModel == "" {
		routerModel = "Utama"
	}
	if req.Model != "" && !strings.EqualFold(req.Model, "utama") {
		routerModel = req.Model
	}

	langRule := "Language: Formulate all questions, aiObservation, and suggestedOptions in Indonesian with developer English terms."
	if strings.EqualFold(req.Language, "en") {
		langRule = "Language: Formulate all questions, aiObservation, and suggestedOptions strictly in professional English."
	}

	interviewSystemPrompt := fmt.Sprintf(`You are an elite, highly discerning Principal Product Architect conducting a discovery interview with a founder/builder.
Your task: Analyze the user's raw idea and interview history. Follow a mandatory, disciplined 3-stage discovery process to prepare a world-class PRD:

%s

STAGE DISCOVERY RULES:
1. Turn 1 (when 0 questions answered):
   - Category: "workflow"
   - Focus: Core problem statement, primary user persona, and MVP execution scope.
   - Question: Ask the single most critical workflow or problem prioritization question.
   - SuggestedOptions: 3-4 razor-sharp, distinct workflow choices tailored tightly to this exact idea domain.

2. Turn 2 (when 1 question answered):
   - Category: "tech_stack"
   - Focus: MANDATORY Tech Stack & Engineering Architecture.
   - Question: Ask what frontend framework, backend language, database, and cloud infrastructure the user wants to use.
   - SuggestedOptions: 3-4 pragmatic, industry-standard modern tech stacks tailored specifically to the complexity of this idea (e.g., Next.js 15 + Go + PostgreSQL, React Vite + Bun/Hono + Drizzle, FastAPI + React + Supabase, Flutter + Node.js).

3. Turn 3 (when 2 questions answered):
   - Category: "design"
   - Focus: MANDATORY Visual Design Theme, Aesthetic Vibe & Curated Color Tokens.
   - Question: Ask what visual aesthetic, UI theme, and color palette tokens best represent this product's brand personality.
   - SuggestedOptions: 3-4 distinct visual aesthetic themes with specific hex codes tailored to this industry (e.g., "Swiss Clinical Minimalist (#0D9488 Teal & #F8FAFC)", "Dark Futuristic Terminal (#10B981 Emerald & #09090B)", "Clean Stripe / Linear Editorial (#4F46E5 Indigo & #FFFFFF)", "Warm Artisanal / Earthy (#D97706 Amber & #FAF7F2)").

4. Turn 4+ (when 3 or more questions answered):
   - Set readinessScore to >= 90 and isSufficient: true.
   - Summarize the architectural consensus in aiObservation. nextQuestion can be omitted or kept empty.

CRITICAL RULES:
- Every suggestedOptions array MUST contain 3-4 options dynamically generated and deeply relevant to the specific product niche. NEVER use generic placeholders.
- Output STRICT JSON ONLY matching this exact structure:
{
  "readinessScore": 65,
  "isSufficient": false,
  "aiObservation": "Brief insight on what has been determined and the next critical decision.",
  "nextQuestion": {
    "category": "workflow" | "tech_stack" | "design",
    "question": "The razor-sharp next question?",
    "suggestedOptions": [
      "Option 1 specifically tailored",
      "Option 2 specifically tailored",
      "Option 3 specifically tailored"
    ]
  }
}`, langRule)

	var userPromptSb strings.Builder
	userPromptSb.WriteString(fmt.Sprintf("Original Idea: %s\n\nInterview History So Far:\n", req.Idea))
	if len(req.History) == 0 {
		userPromptSb.WriteString("(Turn 1 of 3: Focus on WORKFLOW & CORE VALUE. category: workflow)\n")
	} else if len(req.History) == 1 {
		userPromptSb.WriteString(fmt.Sprintf("Turn 1 completed: Q: %s | A: %s\n\nNow at Turn 2 of 3: You MUST ask about TECH STACK & ENGINEERING ARCHITECTURE. category: tech_stack. Provide 3-4 domain-ideal stack combos.\n", req.History[0].Question, req.History[0].Answer))
	} else if len(req.History) == 2 {
		userPromptSb.WriteString(fmt.Sprintf("Turn 1 & 2 completed.\nQ1: %s | A1: %s\nQ2: %s | A2: %s\n\nNow at Turn 3 of 3: You MUST ask about UI/UX DESIGN THEME, COLOR PALETTE & AESTHETIC VIBE. category: design. Provide 3-4 aesthetic themes with specific HEX palette tokens.\n", req.History[0].Question, req.History[0].Answer, req.History[1].Question, req.History[1].Answer))
	} else {
		for i, t := range req.History {
			userPromptSb.WriteString(fmt.Sprintf("%d. Q: %s\n   A: %s\n", i+1, t.Question, t.Answer))
		}
		userPromptSb.WriteString("\nAll 3 core pillars (Workflow, Tech Stack, Design) are answered! Set readinessScore to >= 90 and isSufficient: true.\n")
	}

	if routerBaseURL == "" || routerKey == "" {
		// Fallback mock clarification if no router
		mockTurns := len(req.History)
		mockResp := ClarifyInterviewResponse{
			ReadinessScore: 40 + mockTurns*25,
			IsSufficient:   mockTurns >= 3,
			AIObservation:  fmt.Sprintf("Menganalisis ide '%s'. Menentukan spesifikasi teknis dan visual.", req.Idea),
		}

		isEN := strings.EqualFold(req.Language, "en")
		if isEN {
			mockResp.AIObservation = fmt.Sprintf("Analyzing idea '%s'. Defining technical and visual specifications.", req.Idea)
			if mockTurns == 0 {
				mockResp.NextQuestion = &NextQuestion{
					Category: "workflow",
					Question: fmt.Sprintf("For '%s', what primary user workflow and problem should be prioritized for MVP?", req.Idea),
					SuggestedOptions: []string{
						"Standalone Mobile-First Web App with Self-Service Onboarding",
						"SaaS Platform Integrated with WhatsApp API & Real-Time Alerts",
						"Multi-Tenant Admin Portal with Role-Based Access Control",
					},
				}
			} else if mockTurns == 1 {
				mockResp.NextQuestion = &NextQuestion{
					Category: "tech_stack",
					Question: "What tech stack and engineering architecture do you want to employ?",
					SuggestedOptions: []string{
						"Next.js 15 (App Router) + Tailwind CSS v4 + PostgreSQL + Prisma",
						"React 19 (Vite) + Golang Chi + PostgreSQL + Redis",
						"Fullstack TypeScript (Bun + Hono + Drizzle ORM + Cloudflare)",
						"Mobile App (Flutter / React Native) + Python FastAPI + Supabase",
					},
				}
			} else if mockTurns == 2 {
				mockResp.NextQuestion = &NextQuestion{
					Category: "design",
					Question: "What visual design direction, aesthetic theme, and color palette tokens do you prefer?",
					SuggestedOptions: []string{
						"Simple Neobrutalism (#4F46E5 Indigo, #0EA5E9 Sky & #F6F3EE Paper Cream)",
						"Swiss Clinical Minimalist (#0D9488 Teal, #0284C7 Sky & #F8FAFC Slate)",
						"Dark Modern Terminal (#10B981 Emerald, #06B6D4 Cyan & #09090B Zinc)",
						"Clean Stripe / Linear Editorial (#6366F1 Iris, #EC4899 Rose & #FFFFFF Surface)",
					},
				}
			} else {
				mockResp.IsSufficient = true
				mockResp.ReadinessScore = 95
				mockResp.AIObservation = "All core architecture pillars (Workflow, Tech Stack, Design) are aligned and ready."
			}
		} else {
			if mockTurns == 0 {
				mockResp.NextQuestion = &NextQuestion{
					Category: "workflow",
					Question: fmt.Sprintf("Untuk '%s', bagaimana alur pengguna utama yang ingin diprioritaskan pada tahap MVP?", req.Idea),
					SuggestedOptions: []string{
						"Aplikasi Web Mobile-First Mandiri dengan Self-Service Onboarding",
						"SaaS Terintegrasi WhatsApp API & Notifikasi Real-Time",
						"Portal Admin Multi-Tenant dengan Role-Based Access Control",
					},
				}
			} else if mockTurns == 1 {
				mockResp.NextQuestion = &NextQuestion{
					Category: "tech_stack",
					Question: "Pilihan Tech Stack & Arsitektur engineering apa yang ingin Anda gunakan?",
					SuggestedOptions: []string{
						"Next.js 15 (App Router) + Tailwind CSS v4 + PostgreSQL + Prisma",
						"React 19 (Vite) + Golang Chi + PostgreSQL + Redis",
						"Fullstack TypeScript (Bun + Hono + Drizzle ORM + Cloudflare)",
						"Mobile App (Flutter / React Native) + Python FastAPI + Supabase",
					},
				}
			} else if mockTurns == 2 {
				mockResp.NextQuestion = &NextQuestion{
					Category: "design",
					Question: "Bagaimana preferensi arah visual, tema estetika, dan palet warna yang Anda inginkan?",
					SuggestedOptions: []string{
						"Simple Neobrutalism (#4F46E5 Indigo, #0EA5E9 Sky & #F6F3EE Paper Cream)",
						"Swiss Clinical Minimalist (#0D9488 Teal, #0284C7 Sky & #F8FAFC Slate)",
						"Dark Modern Terminal (#10B981 Emerald, #06B6D4 Cyan & #09090B Zinc)",
						"Clean Stripe / Linear Editorial (#6366F1 Iris, #EC4899 Rose & #FFFFFF Surface)",
					},
				}
			} else {
				mockResp.IsSufficient = true
				mockResp.ReadinessScore = 95
				mockResp.AIObservation = "Seluruh pilar arsitektur (Workflow, Tech Stack, Desain) telah disepakati dan siap diproses."
			}
		}

		_ = json.NewEncoder(w).Encode(mockResp)
		return
	}

	payload := map[string]interface{}{
		"model": routerModel,
		"messages": []map[string]string{
			{"role": "system", "content": interviewSystemPrompt},
			{"role": "user", "content": userPromptSb.String()},
		},
		"response_format": map[string]string{"type": "json_object"},
		"stream":          false,
	}
	bodyBytes, _ := json.Marshal(payload)

	endpoint := strings.TrimRight(routerBaseURL, "/") + "/chat/completions"
	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+routerKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := apiClient.Do(httpReq)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		http.Error(w, fmt.Sprintf(`{"error":"Router error %d: %s"}`, resp.StatusCode, string(b)), http.StatusInternalServerError)
		return
	}

	var chatResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil || len(chatResp.Choices) == 0 {
		http.Error(w, `{"error":"Empty response from model"}`, http.StatusInternalServerError)
		return
	}

	rawContent := chatResp.Choices[0].Message.Content
	// Extract JSON substring in case wrapper markdown tags are present
	trimmed := strings.TrimSpace(rawContent)
	if strings.HasPrefix(trimmed, "```") {
		trimmed = strings.TrimPrefix(trimmed, "```json")
		trimmed = strings.TrimPrefix(trimmed, "```")
		trimmed = strings.TrimSuffix(trimmed, "```")
		trimmed = strings.TrimSpace(trimmed)
	}

	var parsed ClarifyInterviewResponse
	if err := json.Unmarshal([]byte(trimmed), &parsed); err != nil {
		// Fallback parse recovery
		parsed = ClarifyInterviewResponse{
			ReadinessScore: 70,
			IsSufficient:   false,
			AIObservation:  "Ide sedang dianalisis.",
			NextQuestion: &NextQuestion{
				Question: "Apa fokus utama yang membedakan aplikasi ini dengan kompetitor?",
				SuggestedOptions: []string{
					"Kemudahan & kecepatan tanpa login",
					"Otomasi AI & integrasi workflow",
					"Biaya murah / open-source",
				},
			},
		}
	}

	_ = json.NewEncoder(w).Encode(parsed)
}

// handleRefineSection handles in-place micro-adjustments for a single bento card
func handleRefineSection(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	var req RefineSectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Instruction) == "" {
		http.Error(w, "Instruction is required", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	ctx, cancel := context.WithTimeout(r.Context(), 90*time.Second)
	defer cancel()

	routerBaseURL := os.Getenv("ROUTER_BASE_URL")
	routerKey := os.Getenv("ROUTER_API_KEY")
	routerModel := os.Getenv("ROUTER_MODEL")
	if routerModel == "" {
		routerModel = "Utama"
	}
	if req.Model != "" && !strings.EqualFold(req.Model, "utama") {
		routerModel = req.Model
	}

	refineLang := "Output in Indonesian with developer English terms."
	if strings.EqualFold(req.Language, "en") {
		refineLang = "Output strictly in professional English."
	}

	refineSystemPrompt := fmt.Sprintf(`You are a World-Class Principal Product Architect and Design Lead.
The user wants to REVISE ONLY the specific Bento Card section: "%s".
Language Rule: %s

Your mission:
1. Read the CURRENT CONTENT of this section.
2. Apply the user's REVISION INSTRUCTION strictly and seamlessly.
3. Keep the exact high-vibe styling, markdown formatting, and technical depth.
4. DO NOT output any global section delimiters (like <<<SECTION_...>>>).
5. Output ONLY the updated markdown content for this specific section.`, req.SectionKey, refineLang)

	userPrompt := fmt.Sprintf("CURRENT SECTION CONTENT:\n%s\n\nUSER'S MODIFICATION INSTRUCTION:\n%s\n\nPlease output the rewritten markdown for this section now:", req.CurrentContent, req.Instruction)

	if routerBaseURL == "" || routerKey == "" {
		sendMeta(w, flusher, "mock", req.Model, "local-simulation")
		// Mock streaming refinement
		mockTokens := []string{
			fmt.Sprintf("\n\n> *Diperbarui dengan instruksi: %s*\n\n", req.Instruction),
			req.CurrentContent,
		}
		for _, tok := range mockTokens {
			sendChunk(w, flusher, tok)
			time.Sleep(20 * time.Millisecond)
		}
		sendSSE(w, flusher, "done", `{"status":"completed"}`)
		return
	}

	sendMeta(w, flusher, "9router", req.Model, routerModel)

	payload := map[string]interface{}{
		"model": routerModel,
		"messages": []map[string]string{
			{"role": "system", "content": refineSystemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"stream": true,
	}
	bodyBytes, _ := json.Marshal(payload)

	endpoint := strings.TrimRight(routerBaseURL, "/") + "/chat/completions"
	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		sendSSE(w, flusher, "error", fmt.Sprintf(`{"error": %q}`, err.Error()))
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+routerKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := apiClient.Do(httpReq)
	if err != nil {
		sendSSE(w, flusher, "error", fmt.Sprintf(`{"error": %q}`, err.Error()))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		sendSSE(w, flusher, "error", fmt.Sprintf(`{"error": "Router status %d: %s"}`, resp.StatusCode, string(b)))
		return
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
		}

		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if strings.TrimSpace(data) == "[DONE]" {
			break
		}

		var chunkObj struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if err := json.Unmarshal([]byte(data), &chunkObj); err == nil && len(chunkObj.Choices) > 0 {
			token := chunkObj.Choices[0].Delta.Content
			if token != "" {
				sendChunk(w, flusher, token)
			}
		}
	}

	sendSSE(w, flusher, "done", `{"status":"completed"}`)
}

