package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
)

func TestHealthCheck(t *testing.T) {
	r := chi.NewRouter()
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	req := httptest.NewRequest("GET", "/api/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), `"status":"ok"`) {
		t.Fatalf("expected status ok body, got %s", w.Body.String())
	}
}

func TestGetModels(t *testing.T) {
	r := chi.NewRouter()
	r.Get("/api/models", handleGetModels)

	req := httptest.NewRequest("GET", "/api/models", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ModelsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(resp.Models) == 0 {
		t.Fatalf("expected model list to be populated")
	}
	if resp.Default != "Utama" {
		t.Fatalf("expected default model to be Utama, got %s", resp.Default)
	}
}

func TestGenerateEndpointValidation(t *testing.T) {
	r := chi.NewRouter()
	r.Post("/api/generate", handleGenerate)

	// Test empty idea validation
	payload := []byte(`{"idea": "", "model": "gpt-4o"}`)
	req := httptest.NewRequest("POST", "/api/generate", bytes.NewReader(payload))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for empty idea, got %d", w.Code)
	}
}

func TestRateLimiting(t *testing.T) {
	r := chi.NewRouter()
	limiter := newRateLimiter(2, time.Second)
	r.Use(rateLimitMiddleware(limiter))
	r.Get("/api/ping", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("pong"))
	})

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest("GET", "/api/ping", nil)
		req.RemoteAddr = "192.0.2.1:12345"
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("request %d should pass, got status %d", i+1, w.Code)
		}
	}

	// 3rd request exceeds limit of 2
	req3 := httptest.NewRequest("GET", "/api/ping", nil)
	req3.RemoteAddr = "192.0.2.1:12345"
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusTooManyRequests {
		t.Fatalf("request 3 should be 429 Too Many Requests, got %d", w3.Code)
	}
}
