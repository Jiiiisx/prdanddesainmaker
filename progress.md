# Progress Project: AI PRD & Design Brief Generator

**Tanggal:** 10 Oktober 2026  
**Status:** MVP + Simple Neobrutalism UI + Adaptive Clarification Interview + In-Place Bento Refine + Local History Selesai Diimplementasikan

---

## 1. Dokumen Spesifikasi yang Telah Diperbarui
* **`ai_prd_design_brief_generator_prd.md` (v2.1.0):**
  * Alur Progressive Disclosure 3 Fase: *Hero View* $\rightarrow$ *Adaptive Clarification Interview* $\rightarrow$ *Dynamic Bento Grid*.
  * Protokol streaming berbasis penanda delimiter section (`<<<SECTION_SUMMARY>>>`, `<<<SECTION_FEATURES>>>`, `<<<SECTION_TECH>>>`, `<<<SECTION_DESIGN>>>`, `<<<SECTION_PROMPTS>>>`).
  * In-place AI Refinement per kartu Bento via streaming terisolasi (`POST /api/refine-section`).
  * Backend Go (Chi) dengan penanganan timeout context dan auto-cancel via `r.Context().Done()`.
* **`desain.md`:**
  * Panduan gaya *Simple Neobrutalism* (Clean Indigo `#4F46E5`, Architectural Paper Cream `#F6F3EE`, border `#18181B`, hard drop shadow `shadow-[4px_4px_0px_0px_#18181B]`).
  * Arsitektur Bento Grid 12-kolom responsif dengan 6 kartu modular adaptif.
  * Spesifikasi komponen interaktif (interactive color token chips, AI refine micro-bar, dynamic suggestion chips, tactile button feedback).

---

## 2. Pekerjaan yang Sudah Diselesaikan

### A. Backend (Golang) — Direktori `backend/`
* Inisialisasi modul Go (`prd-generator`) menggunakan router Chi v5 dan middleware CORS.
* Integrasi 9Router Lokal (`http://localhost:20128/v1`) untuk model combo `Utama` (Gemini Pro & Flash, Claude) via format OpenAI-compatible streaming SSE.
* Auto-loader untuk file konfigurasi `.env`.
* **Endpoint:**
  * `GET /api/health`: Health check status server.
  * `POST /api/generate`: Mengalirkan token dokumen PRD lengkap via SSE dengan delimiter section terstruktur.
  * `POST /api/clarify-interview`: Menganalisis ide dan mengajukan pertanyaan spesifik dengan suggestion chips dinamis berbasis JSON.
  * `POST /api/refine-section`: Mengalirkan SSE token untuk merevisi konten spesifik satu kartu bento tanpa menyentuh kartu lain.
* Unit test backend (`backend/main_test.go`) terverifikasi lulus.

### B. Frontend (React 19 + TypeScript + Vite) — Direktori `frontend/`
* Konfigurasi Tailwind CSS v4 (`@tailwindcss/vite`) dan utilitas Neobrutalism (`neo-card`, `neo-btn`, `neo-input`, `bento-prose`).
* Model selector default diarahkan ke `Utama (9Router Gemini Pro Combo)`.
* Transisi fluid motion (`framer-motion`) antar 3 fase.
* **Komponen yang dibangun:**
  * `AmbientBackground.tsx`: Latar belakang kanvas Neobrutalism krem dengan grid dots halus.
  * `HeroPhase.tsx`: Tampilan terpusat dengan preset *Quick Suggestion Chips* dan tombol akses riwayat.
  * `ClarificationPhase.tsx`: Tampilan dialog interogasi adaptif dengan meteran kejelasan AI, suggestion chips dinamis per kasus, dan opsi lewati (fast-track).
  * `BentoPhase.tsx`: Grid 12-kolom dengan kartu kontrol, model selector, export suite (`.md`), tombol copy seluruh PRD, dan tombol riwayat.
  * `BentoCard.tsx`: Kartu modular neobrutalism dengan rendering Markdown, tombol copy, mode fullscreen, dan **in-place micro-bar AI Refinement**.
  * `ColorPaletteSection.tsx`: Palet warna interaktif dengan fitur salin HEX 1-klik dan indikator visual status tersalin.
  * `HistoryModal.tsx`: Modal neobrutalism untuk memuat ulang, melihat, dan menghapus riwayat PRD yang tersimpan.
* **Utilitas & Pengujian:**
  * `streamParser.ts`: Real-time demultiplexer chunk SSE ke state kartu bento masing-masing.
  * `historyStorage.ts`: LocalStorage persistence untuk riwayat PRD (auto-save setelah generate selesai).
  * `canvas-confetti`: Efek selebrasi visual otomatis saat proses streaming PRD selesai sempurna.
  * Test stream parser (`frontend/test/streamParser.test.mjs`) terverifikasi lulus (termasuk fallback heading parser).
* Konfigurasi proxy dev server Vite ke port backend `:8080`.

### C. Perbaikan Sistem (System Hardening & Resilience)
* **Hybrid Fallback Stream Parser:** Parser frontend tidak lagi rapuh terhadap hilangnya delimiter `<<<SECTION_...>>>` karena dilengkapi fallback regex berbasis heading Markdown standar.
* **Ekstraksi Token Warna Terfilter:** Ekstraksi warna di `streamParser.ts` memprioritaskan baris token palet terstruktur dan mengabaikan warna border UI umum (`#18181B`).
* **In-Memory Rate Limiting (Backend):** Token bucket limiter per IP (maks. 30 req/menit) tanpa dependency tambahan untuk mencegah kebanjiran request/token exhaustion.
* **HTTP Connection Pooling (Backend):** Mengganti `http.DefaultClient` dengan instance `http.Client` ber-transport pooled (`MaxIdleConns: 50`, `IdleConnTimeout: 90s`).
* **CORS Penguncian Ketat:** Mengganti wildcard `*` dengan daftar origin dev terpercaya dan konfigurasi `ALLOWED_ORIGIN`.
* **Transparansi Provider Model & Endpoint `/api/models`:** Backend mengirimkan SSE `event: meta` dan menyediakan endpoint status ketersediaan model riil (apakah via direct key atau fallback 9Router).
* **Preservasi Stream & Action Retry:** Error streaming tidak lagi menghapus token yang sudah diterima, dan UI menyediakan tombol "Coba Lagi" langsung.
* **Pencarian Riwayat & Backup JSON:** `HistoryModal` dilengkapi kolom pencarian instan dan tombol unduh backup riwayat dokumen ke format JSON.

### D. Perbaikan Layout & UX (Ergonomics & Visual Containment)
* **Top Collapsible Control Banner (`BentoPhase.tsx`):** Menghapus sidebar kiri dan menggantinya dengan panel kontrol horizontal di bagian atas kanvas (dengan tombol ciutkan/buka). Ini menyelesaikan masalah ruang kosong memanjang dan memberikan 100% lebar layar penuh untuk Bento Grid.
* **Full-Width 12-Column Bento Grid:** 5 kartu bento PRD kini tersusun simetris dan lapang melintasi lebar kanvas tanpa tabrakan layer.
* **Bento Height Containment (`BentoCard.tsx`):** Mencegah asimetri *dead space* antar-kartu dengan membatasi tinggi body kartu ke `max-h-[540px]` menggunakan internal custom scrollbar.
* **Backdrop & Escape Listener Fullscreen (`BentoCard.tsx`):** Menambahkan backdrop overlay gelap (`bg-[#18181B]/40 backdrop-blur-xs`), penguncian scroll body, dan listener tombol keyboard `Escape` untuk menutup kartu fullscreen secara intuitif.
* **Konfirmasi Navigasi Antar-Fase:** Menambahkan modal konfirmasi sebelum tombol "Ubah Ide Utama" dieksekusi jika kanvas PRD sedang memiliki konten aktif, mencegah kehilangan draf dokumen.
* **Aktivasi Font Web Plus Jakarta Sans (`index.css`):** Mengganti font-family body fallback dengan `Plus Jakarta Sans` sesuai spesifikasi design token.

### E. Perbaikan Desain & Token Visual (Simple Neobrutalism System)
* **Standardisasi Skala Shadow (`index.css`):** Mengganti arbitrary inline shadows dengan skala token neobrutal terstruktur (`neo-shadow-sm: 2px`, `neo-shadow-md: 4px`, `neo-shadow-lg: 6px`, `neo-shadow-xl: 8px`).
* **Penerapan Font JetBrains Mono:** Elemen kode markdown `.bento-prose code` dan `pre code` kini secara eksplisit menggunakan Google Font `JetBrains Mono`.
* **Polish Interaktif Color Tokens (`ColorPaletteSection.tsx`):** Menambahkan dark contrast overlay saat swatch warna disalin agar checkmark tetap terbaca jelas di atas warna terang (`#FFFFFF`/`#F8FAFC`).
* **Pembersihan Residu Glassmorphism:** Menghapus kelas-kelas usang `.glass-panel` dan memperbarui teks spesifikasi pada `desain.md`, `ai_prd_design_brief_generator_prd.md`, serta template prompt mock backend agar 100% konsisten dengan Simple Neobrutalism.

### F. Alur Interview 3-Tahap Terarah & Design Inspiration Hub
* **Alur Interview 3-Pilar Wajib (`backend/main.go`):**
  - Tahap 1: Workflow & Prioritas MVP
  - Tahap 2: Tech Stack & Arsitektur Engineering (dengan rekomendasi stack paling ideal untuk domain produk)
  - Tahap 3: Arah Desain, Tema & Palet Warna (dengan rekomendasi tema visual dan kode HEX spesifik industri)
* **Design Inspiration Hub (`ClarificationPhase.tsx`):**
  - Khusus pada tahap 3 (Desain), pengguna dapat menyertakan link URL referensi (Linear, Stripe, Dribbble).
  - Mendukung upload file gambar atau **langsung paste `Ctrl+V`** dari clipboard untuk poster, foto, atau mockup UI.
  - **Ekstraksi Palet Warna Otomatis (`colorExtractor.ts`):** Menggunakan HTML5 Canvas API untuk mendeteksi warna dominan dari gambar yang diunggah secara instan dan menampilkan preview HEX chips.
  - Pilihan tema, URL, dan palet warna ekstraksi otomatis digabungkan ke draf klarifikasi untuk dikirim ke generator AI.

### G. Fitur Dwi-Bahasa (Indonesian & English Support)
* **Kamus Terjemahan Tipe Aman (`translations.ts`):** Menyediakan kamus dwi-bahasa lengkap untuk seluruh fase (Hero, Clarification, Bento, dan History Modal).
* **Komponen `LanguageToggle.tsx`:** Tombol switch Neobrutalism `[ ID | EN ]` yang terpasang di top bar navigasi pada semua tahapan dan otomatis tersimpan di `localStorage`.
* **Dukungan AI Multi-Bahasa (`backend/main.go`):**
  - Menerima parameter `language` (`id` atau `en`) pada `/api/generate`, `/api/clarify-interview`, dan `/api/refine-section`.
  - Mengarahkan prompt sistem LLM dan data mock offline untuk memformulasikan pertanyaan klarifikasi, rekomendasi chips, serta dokumen PRD secara penuh dalam Bahasa Inggris atau Bahasa Indonesia.

---

## 3. Hasil Verifikasi Sistem
* **Go Backend Test:** `go test -v -count=1 ./...` $\rightarrow$ `PASS` (4 tests: HealthCheck, GetModels, GenerateEndpointValidation, RateLimiting).
* **Frontend Typecheck & Build:** `npm run build` $\rightarrow$ `dist/` terbentuk sukses tanpa error TypeScript.
* **Linter & Test Frontend:** `npm run lint` & `npm run test` $\rightarrow$ `PASS` (0 warnings).
* **End-to-End SSE Test:** Teruji mengalirkan 6.000+ bytes event chunks secara berkala.

---

## 4. Cara Melanjutkan di Sesi Berikutnya

### Menjalankan Backend:
```bash
cd backend
go run main.go
# Server berjalan di http://localhost:8080
```

### Menjalankan Frontend:
```bash
cd frontend
npm run dev
# Akses antarmuka di http://localhost:5173
```

### Rekomendasi Fitur Lanjutan (Opsional):
1. Menambahkan opsi ekspor langsung ke format PDF atau HTML selain format Markdown (`.md`).
2. Menambahkan pengaturan slider temperatur kreativitas LLM di kartu kontrol Bento.
3. Menambahkan pengaturan konfigurasi API Key dan model endpoint kustom langsung dari UI.
