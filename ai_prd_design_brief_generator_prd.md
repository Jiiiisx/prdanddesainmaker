# Product Requirements Document (PRD)
**Project Name:** AI PRD & Design Brief Generator  
**Platform:** Web Application (React TS + Golang)  
**Target Audience:** Software Engineers, Product Builders, Solopreneurs  
**Version:** 2.0.0  

---

## 1. Overview & Objective
Aplikasi web ini adalah alat bantu produktivitas (*internal developer tool*) untuk menerjemahkan ide kasar aplikasi menjadi dokumen Product Requirements Document (PRD) teknis dan Design Brief UI/UX yang terstruktur dan siap eksekusi. 

Aplikasi menggunakan pendekatan antarmuka **Progressive Disclosure** (Hero Minimalis $\rightarrow$ Adaptive Clarification Interview $\rightarrow$ Dynamic Bento Grid) dengan estetika **Simple Neobrutalism (Clean Indigo & Architectural Paper Cream)**, serta arsitektur streaming modular berbasis delimiter agar konten terdistribusi rapi ke kartu-kartu bento secara *real-time*.

---

## 2. Core Workflow (User Journey)

### Tahap 1: Hero View (Inisiasi Ide)
1. Pengguna membuka aplikasi dan disajikan antarmuka bersih di tengah layar dengan pertanyaan utama: *"Ingin membuat apa hari ini?"*.
2. Pengguna dapat memilih **Quick Suggestion Chips** untuk inspirasi cepat (misal: *"B2B SaaS Analytics"*, *"E-Commerce Mobile App"*, *"AI Workflow Automation"*) atau langsung mengetik ide kasar di kolom input utama.
3. Pengguna menekan tombol "Lanjut ke Spesifikasi" atau menekan shortcut `Enter`.

### Tahap 2: Dynamic Bento Grid View (Spesifikasi & Real-time Generation)
4. Tampilan bertransformasi mulus (*fluid animation*) menjadi Bento Grid adaptif.
5. Input ide awal berada di kartu kontrol bersama opsi pemilihan model LLM (Claude 3.5 Sonnet / GPT-4o) dan tombol "Generate PRD".
6. Pengguna menekan "Generate PRD".
7. Backend Golang mengalirkan (*streaming*) token dari LLM via Server-Sent Events (SSE) dengan penanda delimiter section.
8. Frontend mem-parsing chunk SSE secara langsung dan mengisi kartu-kartu Bento Grid secara independen dan real-time:
   * **Kartu Summary & Target Users**
   * **Kartu Core Features & Scope**
   * **Kartu Technical Architecture & API**
   * **Kartu UI/UX Direction & Interactive Color Swatches**
   * **Kartu Ready-to-use AI Prompts**
9. Setelah selesai, pengguna dapat menyalin konten per kartu atau mengunduh seluruh dokumen sebagai satu file `.md`.

---

## 3. Functional Requirements

### 3.1 Fase 1: Hero Section
* **Hero Prompt Input:** Input teks minimalis dan fokus dengan animasi fokus yang halus.
* **Quick Suggestion Chips:** Daftar tag/chip preset ide yang dapat diklik untuk langsung mengisi input prompt.
* **Transition Trigger:** Tombol transisi ke fase Bento Grid dengan shortcut keyboard `Enter`.

### 3.2 Fase 2: Control & Configuration Card (Bento Item)
* **Editable Idea Input:** Input ide yang tetap bisa diedit/disesuaikan tanpa kembali ke layar awal.
* **Model Selection:** Dropdown model LLM (Claude 3.5 Sonnet sebagai default, GPT-4o).
* **Generation Controller:** Tombol generate dengan state `Idle`, `Streaming (Loading)`, dan `Regenerate`.

### 3.3 Modular Output Cards (Dynamic Bento Grid)
Output streaming diurai menggunakan delimiter section khusus:
* **Section A - Executive Summary & Objectives (`<<<SECTION_SUMMARY>>>`):** Latar belakang masalah, nilai solusi, dan persona target pengguna.
* **Section B - Core Features & Requirements (`<<<SECTION_FEATURES>>>`):** Fitur utama MVP, batasan non-fungsional, dan acceptance criteria.
* **Section C - Technical Architecture (`<<<SECTION_TECH>>>`):** Rekomendasi Tech Stack, skema database relasional/dokumen sederhana, dan daftar REST/gRPC API inti dalam format Monospace.
* **Section D - UI/UX Design Brief (`<<<SECTION_DESIGN>>>`):** Arah visual, tipografi, dan palet warna interaktif (HEX code yang dapat diklik untuk disalin).
* **Section E - AI UI/Image Prompts (`<<<SECTION_PROMPTS>>>`):** Prompt siap pakai untuk Midjourney, v0.dev, atau Bolt.new dengan tombol *1-Click Copy*.

### 3.4 Utility Features
* **Streaming Parser:** Parser frontend yang memetakan chunk SSE ke state kartu bento yang sesuai tanpa jeda.
* **Copy per Section:** Setiap kartu bento memiliki tombol salin mandiri untuk konten kartu tersebut.
* **Full Export:** Tombol global di header/toolbar untuk mengunduh seluruh dokumen gabungan sebagai format `.md`.

---

## 4. Technical Architecture

### 4.1 Frontend (React + TypeScript)
* **Framework:** React 18+ dengan Vite.
* **Styling & System:** Tailwind CSS v4 + Simple Neobrutalism design tokens + Lucide Icons.
* **Motion & Animation:** Framer Motion (untuk layout transitions antar-fase dan resize kartu bento dinamis).
* **Markdown Renderer:** `react-markdown` + `remark-gfm` + `rehype-highlight`.
* **State Management:** React Context / Zustand atau React Hooks bawaan (`useState`, `useRef`, `useMemo`).

### 4.2 Backend (Golang)
* **Framework:** Chi atau Gin (ringan, performa tinggi, native `net/http` compatibility).
* **API Endpoints:**
  * `POST /api/generate`: Menerima payload `{ "idea": string, "model": string }`.
  * Return type: `text/event-stream` (SSE).
* **Streaming & Resource Management:**
  * Menggunakan `http.Flusher` untuk flush token secara berkala.
  * `context.WithTimeout` maksimal 120 detik per request.
  * Listen pada `r.Context().Done()`: jika user memutus koneksi/menutup browser, pemanggilan stream ke provider LLM langsung dihentikan untuk menghemat biaya token.
* **LLM Prompting Strategy:**
  * Menggunakan satu *system prompt* terstruktur ketat yang mewajibkan penyisipan section delimiter standar untuk memudahkan demultiplexing di klien.

---

## 5. Non-Functional Requirements & Constraints
* **Latency:** First token arrival target $\le 1.5$ detik setelah trigger generate.
* **Responsiveness:** Tampilan Bento Grid adaptif dari desktop multi-kolom hingga tablet/mobile single-column stack.
* **Out of Scope (V2.0.0):**
  * Akun pengguna & sistem autentikasi.
  * Penyimpanan database riwayat PRD.
  * Fitur kolaborasi multi-user realtime.
