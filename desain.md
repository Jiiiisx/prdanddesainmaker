# Desain Sistem & UI/UX Brief: AI PRD & Design Brief Generator

**Konsep Desain:** Simple Neobrutalism (Clean Indigo & Architectural Paper Cream)  
**Pendekatan Interaksi:** Progressive Disclosure 3-Fase (Hero Minimalist $\rightarrow$ Adaptive Clarification Interview $\rightarrow$ Dynamic Bento Grid)  
**Target Platform:** Web Desktop & Tablet (Fully Responsive)  
**Tech Stack UI:** React 19 (TypeScript) + Tailwind CSS v4 + Framer Motion + Lucide Icons  

---

## 1. Visual Token & Style Guide

### 1.1 Color Palette & Surfaces
* **Canvas Background:** `#F6F3EE` (Warm Architectural Paper Cream) dengan subtle dot-grid (`#18181B` opacity 10%).
* **Card Surface:** `#FFFFFF` murni dengan border hitam pekat `2px solid #18181B`.
* **Hard Drop Shadow:** `shadow-[4px_4px_0px_0px_#18181B]` pada Bento Cards, `shadow-[6px_6px_0px_0px_#18181B]` pada Hero Input.
* **Accent Colors:**
  * Primary: `#4F46E5` (Indigo 600)
  * Primary Hover: `#4338CA` (Indigo 700)
  * Secondary Badge: `#FAF7F2` / `#EEF2FF`
  * Text Primary: `#18181B` (Zinc 900)
  * Text Muted: `#52525B` (Zinc 600)
* **Button Tactile Feedback:** Efek mekanik nyata: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`.

### 1.2 Tipografi
* **Interface Font:** Inter / Plus Jakarta Sans
  * Headings: 24px - 32px (font-semibold / bold, tracking-tight)
  * Card Titles: 16px - 18px (font-semibold)
  * Body Text: 14px (font-normal, leading-relaxed)
  * Subtitle / Metadata: 12px (font-medium)
* **Code & Schema Font:** JetBrains Mono / Fira Code
  * Inline Code & Snippets: 13px (font-mono, `bg-slate-100/80 px-1.5 py-0.5 rounded`)

---

## 2. Alur Interaksi & Layout Architecture

### Fase 1: Hero View (Inisiasi Bersih)
Tampilan terpusat secara vertikal dan horizontal di tengah layar (*clean slate*):

```
+-----------------------------------------------------------------------+
|  Top Navigation: [Brand Logo + Version Pill]              [GitHub/Docs]|
+-----------------------------------------------------------------------+
|                                                                       |
|                          "Ingin membuat apa hari ini?"                |
|                    Ubah ide kasar menjadi PRD & Desain siap bangun    |
|                                                                       |
|         +-----------------------------------------------------+       |
|         | [Search/Idea Input Area]                  [→ Enter] |       |
|         +-----------------------------------------------------+       |
|                                                                       |
|         Quick Suggestions:                                            |
|         [+ B2B SaaS Analytics]  [+ E-Commerce Mobile App]             |
|         [+ AI Workflow Automation]  [+ Habit Tracker Mini-app]        |
|                                                                       |
+-----------------------------------------------------------------------+
```

* Interaksi:
  * Mengklik chip otomatis mengisi teks ke input.
  * Menekan tombol panah atau tombol `Enter` mentrigger animasi transisi ke Fase 2 menggunakan Framer Motion `layoutId`.

---

### Fase 2: Dynamic Bento Grid View (Adaptif & Fleksibel)
Setelah beralih ke Fase 2, canvas melebar menjadi grid 12-kolom dengan kartu-kartu bento Simple Neobrutalism:

```
+-----------------------------------------------------------------------------------------+
| Top Bar: [Brand Logo]                            [Status Indicator] [Download .md]      |
+-----------------------------------------------------------------------------------------+
| [BENTO 1: CONTROLS & RAW IDEA] (Col 1-4)    | [BENTO 2: SUMMARY & TARGET] (Col 5-12)     |
| - Textarea Ide Terpilih (Editable)          | - Masalah & Nilai Utama Solusi            |
| - Dropdown Model (Claude 3.5 / GPT-4o)      | - Persona Pengguna Kunci                  |
| - Tombol [Generate / Stop / Regenerate]     |                                           |
+---------------------------------------------+-------------------------------------------+
| [BENTO 3: CORE FEATURES] (Col 1-7)          | [BENTO 4: TECH ARCHITECTURE] (Col 8-12)   |
| - MVP Feature Scope                         | - Rekomendasi Stack (Chips)               |
| - Non-functional constraints                | - Skema Database & REST Endpoints         |
| - Acceptance criteria                       |   (Monospace code blocks)                 |
+---------------------------------------------+-------------------------------------------+
| [BENTO 5: DESIGN BRIEF & PALETTE] (Col 1-6) | [BENTO 6: READY-TO-USE PROMPTS] (Col 7-12)|
| - Visual vibe & Typography direction        | - v0.dev / Bolt.new prompt                |
| - Palet Warna Interaktif (Klik Hex to Copy) | - Midjourney UI aesthetic prompt          |
|   [ #4F46E5 ] [ #0EA5E9 ] [ #F8FAFC ]       |   [Tombol 1-Click Copy]                   |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Spesifikasi Komponen Bento Cards

### 3.1 Bento 1: Controller Card
* Selalu sticky/terlihat di sisi kiri atas.
* Berisi textarea ide asli (bisa diubah untuk regenerate), model selector, dan status streaming.
* Tombol action berubah sesuai status:
  * `Idle`: "Mulai Generate" (`bg-indigo-600 text-white`).
  * `Streaming`: Spinner animasi + "Memproses..." + tombol cancel/stop.
  * `Completed`: "Regenerate PRD".

### 3.2 Bento 2: Summary & Target Users Card
* Header kartu: Badge kategori, judul kartu, tombol salin ringkasan.
* Konten: Paragraf terstruktur mengenai problem statement dan persona pengguna.

### 3.3 Bento 3: Core Features & Scope Card
* Kartu dengan tinggi fleksibel (`min-h-[280px]`).
* Menampilkan daftar bullet list checklist untuk fitur MVP dan scope limitation.

### 3.4 Bento 4: Technical Architecture Card
* Styling bernuansa developer: blok kode bertema light syntax (`bg-slate-900/5 text-slate-800 font-mono text-xs p-3 rounded-xl border border-slate-200/50`).
* Menampilkan skema tabel DB ringkas dan daftar endpoint API inti.

### 3.5 Bento 5: Design Brief & Color Tokens Card
* **Interactive Color Swatches:**
  * Lingkaran/kotak swatch warna berukuran `h-10 w-10` dengan rounded radius halus.
  * Hover menampilkan tooltip deskripsi warna (misal: "Primary Brand").
  * Klik swatch memunculkan toast mini *"Hex #4F46E5 copied!"*.
* Tipografi & vibe rekomendasi UI.

### 3.6 Bento 6: Ready-to-use AI Prompts Card
* Didesain khusus dengan tombol *Copy to Clipboard* berukuran jelas di kanan atas kartu.
* Menampung prompt siap tempel untuk alat prototyping AI (v0.dev, Bolt, Midjourney).

---

## 4. Animasi & Dinamika Bento Grid (Framer Motion)

* **Layout Transition:**
  * Hero Input berpindah posisi ke Bento Card 1 menggunakan `layoutId="main-idea-input"`.
  * Kartu-kartu bento lainnya muncul dengan efek stagger fade-in (`opacity: 0, y: 20` $\rightarrow$ `opacity: 1, y: 0`, delay bertahap 0.08 detik).
* **Adaptive Card Expand:**
  * Pengguna dapat mengklik ikon *expand/fullscreen* pada setiap kartu bento untuk memperbesar fokus kartu menjadi modal overlay atau 100% width grid.
* **Streaming State Visualization:**
  * Tiap kartu bento yang sedang menerima chunk stream menampilkan shimmer skeleton lembut di baris teks aktif dan kursor blinking `|` berwarna aksen.

---

## 5. Aksesibilitas & Responsivitas

* **Mobile & Tablet:**
  * Di layar `< 1024px`, grid 12-kolom secara otomatis beralih menjadi 1-kolom bertingkat vertikal (*stacked view*) dengan urutan: Controller $\rightarrow$ Summary $\rightarrow$ Features $\rightarrow$ Tech $\rightarrow$ Design $\rightarrow$ Prompts.
* **Contrast Compliance:**
  * Semua teks utama di atas surface neobrutalism memenuhi rasio kontras WCAG AA (rasio $\ge 4.5:1$).
