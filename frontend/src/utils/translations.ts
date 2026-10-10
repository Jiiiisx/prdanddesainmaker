import type { AppLanguage } from '../types';

export const translations = {
  id: {
    hero: {
      tagline1: 'Ingin membuat apa',
      tagline2: 'hari ini?',
      subtitle:
        'Tulis ide kasarmu. Sistem akan menerjemahkannya ke dalam PRD teknis lengkap dan panduan desain bento secara instan.',
      inputPlaceholder:
        'Contoh: Aplikasi manajemen tugas klinik kesehatan untuk jadwal pasien dengan dashboard terintegrasi...',
      enterHint: 'Tekan Enter untuk lanjut',
      proceedBtn: 'Lanjut ke Spesifikasi',
      historyBtn: 'Riwayat',
      quickInspiration: 'Quick Inspiration',
      suggestions: [
        { label: 'B2B SaaS Analytics', prompt: 'Dashboard B2B SaaS analitik perilaku pelanggan real-time dengan ringkasan AI' },
        { label: 'Aplikasi Klinik Pasien', prompt: 'Website dan portal reservasi klinik kesehatan untuk penjadwalan pasien dan dashboard admin' },
        { label: 'AI Workflow Automation', prompt: 'Kanvas visual tanpa kode untuk merangkai tugas API LLM dan trigger webhook' },
        { label: 'Habit & Daily Routines', prompt: 'Pelacak kebiasaan bersih bergaya gamifikasi dengan streak harian dan ambient soundscape' },
        { label: 'Cloud Inventory & POS', prompt: 'Sistem POS ritel cepat dengan sinkronisasi offline, multi-gudang, dan pemindai barcode' },
      ],
    },
    clarification: {
      backToIdea: 'Kembali ke Ide',
      clarityScore: 'AI Clarity Score',
      readySuffix: '% Matang',
      contextLabel: 'Ide Utama yang Sedang Dispesifikasi',
      analyzing: 'Principal Architect sedang menganalisis arsitektur dan kebutuhan spesifik...',
      stage1: 'Tahap 1: Alur & Fokus MVP',
      stage2: 'Tahap 2: Pilihan Tech Stack & Arsitektur',
      stage3: 'Tahap 3: Arah Desain & Palet Warna',
      aiOptionsLabel: 'Rekomendasi AI Paling Cocok untuk Kasus Ini:',
      customInputPlaceholder: 'Atau ketik sendiri jawaban/keinginan spesifik Anda...',
      skipBtn: 'Cukup, Buat PRD Sekarang',
      nextBtn: 'Kirim & Pertanyaan Berikutnya',
      finishBtn: 'Selesai & Bangun PRD',
      inspirationHubTitle: 'Inspirasi Desain Tambahan (Opsional)',
      inspirationBadge: 'Website URL & Poster / Foto',
      urlPlaceholder: 'Contoh: https://linear.app, https://stripe.com, dribbble.com/...',
      dropzoneText: 'Klik untuk upload atau Ctrl + V paste poster/foto inspirasi',
      dropzoneSub: 'AI akan mengekstrak palet warna dominan langsung dari gambar Anda!',
      uploadedLabel: 'Poster / Foto Inspirasi Terunggah:',
      removeImage: 'Hapus Gambar',
      extractingPalette: 'Mengekstrak palet warna...',
      paletteExtractedLabel: 'Palet Warna Hasil Ekstraksi Otomatis:',
      imageReady: 'Gambar siap digunakan sebagai referensi.',
      discoveryCompleteTitle: 'Pemahaman Arsitektur & Desain Sudah Sangat Lengkap!',
      discoveryCompleteSub:
        'Alur fitur, tech stack pilihan, dan arah estetika visual Anda sudah tersimpan. AI siap merancang spesifikasi PRD & Design Brief lengkap di Bento Grid.',
      buildBentoBtn: 'Bangun Dynamic Bento PRD',
      agreedDecisions: 'Keputusan yang Sudah Disepakati',
    },
    bento: {
      changeIdea: 'Ubah Ide Utama',
      historyBtn: 'Riwayat',
      copyFullMd: 'Copy Full .md',
      copiedMd: 'Tersalin!',
      exportMd: 'Export .md',
      bannerTitle: 'Spesifikasi Ide & Generator',
      bannerSub: 'Ubah deskripsi ide kasar atau ganti model LLM untuk generasi baru',
      collapseBanner: 'Ciutkan Panel',
      openBanner: 'Buka Panel Spesifikasi',
      rawIdeaLabel: 'Raw Idea Dump',
      rawIdeaPlaceholder: 'Deskripsi ide produk/aplikasi...',
      modelLabel: 'Model LLM',
      stopStream: 'Hentikan',
      regenerate: 'Regenerate',
      generate: 'Generate',
      emptyCard: 'Belum ada data. Klik tombol Generate untuk mengisi.',
      confirmTitle: 'Ubah Ide Utama?',
      confirmDesc:
        'Dokumen PRD aktif Anda sudah tersimpan di riwayat, namun jika Anda mengubah ide sekarang, kanvas bento saat ini akan digantikan dengan sesi baru.',
      stayBtn: 'Tetap di Sini',
      proceedBackBtn: 'Ya, Ubah Ide',
      titles: {
        summary: 'Executive Summary & Objectives',
        features: 'Core Features & MVP Requirements',
        tech: 'Technical Architecture & Schema',
        design: 'UI/UX Direction & Visual Brief',
        prompts: 'Ready-to-Use AI UI Prompts',
      },
      badges: {
        summary: 'Scope & Problem',
        features: 'Product Spec',
        tech: 'Engineering',
        design: 'Design System',
        prompts: 'v0 / Midjourney',
      },
      colorTokensTitle: 'Interactive Color Tokens',
      colorTokensSub: 'Klik swatch untuk copy hex',
      refinePromptPlaceholder: "Misal: 'Ganti ke PostgreSQL', 'Tambahkan login Google'...",
      retry: 'Coba Lagi',
      close: 'Tutup',
    },
    history: {
      title: 'Riwayat PRD',
      subtitle: (count: number) => `${count} dokumen tersimpan secara lokal`,
      backupJson: 'Backup JSON',
      clearAll: 'Hapus Semua',
      searchPlaceholder: 'Cari dalam riwayat (ide, kata kunci)...',
      emptyTitle: 'Belum ada riwayat dokumen',
      emptyDesc: 'PRD yang Anda hasilkan akan otomatis tersimpan di sini.',
      noMatch: (query: string) => `Tidak ada hasil yang cocok dengan "${query}"`,
      resetSearch: 'Reset pencarian',
      openBtn: 'Buka',
      noSummary: 'Tidak ada ringkasan.',
    },
  },
  en: {
    hero: {
      tagline1: 'What do you want to build',
      tagline2: 'today?',
      subtitle:
        'Turn your raw idea into an execution-ready PRD and high-vibe design brief instantly.',
      inputPlaceholder:
        'Example: Healthcare clinic management app for patient scheduling with unified admin dashboard...',
      enterHint: 'Press Enter to proceed',
      proceedBtn: 'Proceed to Specifications',
      historyBtn: 'History',
      quickInspiration: 'Quick Inspiration',
      suggestions: [
        { label: 'B2B SaaS Analytics', prompt: 'Real-time customer behavior analytics B2B SaaS dashboard with AI insights' },
        { label: 'Patient Clinic App', prompt: 'Healthcare clinic booking portal for patient appointments with admin dashboard' },
        { label: 'AI Workflow Automation', prompt: 'No-code visual canvas for chaining LLM API tasks and webhook triggers' },
        { label: 'Habit & Daily Routines', prompt: 'Gamified habit tracker with streak tracking, soundscapes, and clean minimalism' },
        { label: 'Cloud Inventory & POS', prompt: 'High-speed retail POS with offline sync, multi-warehouse inventory, and barcode scanner' },
      ],
    },
    clarification: {
      backToIdea: 'Back to Idea',
      clarityScore: 'AI Clarity Score',
      readySuffix: '% Ready',
      contextLabel: 'Core Idea Being Specified',
      analyzing: 'Principal Architect is analyzing domain architecture & technical constraints...',
      stage1: 'Stage 1: Workflow & MVP Scope',
      stage2: 'Stage 2: Tech Stack & Architecture',
      stage3: 'Stage 3: Visual Design & Color Palette',
      aiOptionsLabel: 'AI Recommendations tailored to this case:',
      customInputPlaceholder: 'Or type your own custom decision/requirement...',
      skipBtn: 'Skip, Generate PRD Now',
      nextBtn: 'Submit & Next Question',
      finishBtn: 'Done & Build PRD',
      inspirationHubTitle: 'Visual Design Inspiration (Optional)',
      inspirationBadge: 'Website URL & Posters / Photos',
      urlPlaceholder: 'E.g.: https://linear.app, https://stripe.com, dribbble.com/...',
      dropzoneText: 'Click to upload or press Ctrl + V to paste visual inspiration image',
      dropzoneSub: 'AI will extract dominant color tokens directly from your image!',
      uploadedLabel: 'Uploaded Inspiration Poster / Photo:',
      removeImage: 'Remove Image',
      extractingPalette: 'Extracting color palette...',
      paletteExtractedLabel: 'Auto-Extracted Color Tokens:',
      imageReady: 'Image attached as visual reference.',
      discoveryCompleteTitle: 'Architecture & Design Discovery Complete!',
      discoveryCompleteSub:
        'Feature workflows, chosen tech stack, and visual aesthetics are locked in. AI is ready to draft your full PRD & Design Brief in the Bento Grid.',
      buildBentoBtn: 'Build Dynamic Bento PRD',
      agreedDecisions: 'Decisions Agreed So Far',
    },
    bento: {
      changeIdea: 'Change Core Idea',
      historyBtn: 'History',
      copyFullMd: 'Copy Full .md',
      copiedMd: 'Copied!',
      exportMd: 'Export .md',
      bannerTitle: 'Idea Specification & Generator',
      bannerSub: 'Adjust raw idea description or switch LLM model for a fresh generation',
      collapseBanner: 'Collapse Panel',
      openBanner: 'Open Specification Panel',
      rawIdeaLabel: 'Raw Idea Dump',
      rawIdeaPlaceholder: 'Describe your product/application idea...',
      modelLabel: 'LLM Model',
      stopStream: 'Stop',
      regenerate: 'Regenerate',
      generate: 'Generate',
      emptyCard: 'No data yet. Click Generate to populate.',
      confirmTitle: 'Change Core Idea?',
      confirmDesc:
        'Your active PRD is safely stored in history. However, changing the core idea now will replace the current bento canvas with a new session.',
      stayBtn: 'Stay Here',
      proceedBackBtn: 'Yes, Change Idea',
      titles: {
        summary: 'Executive Summary & Objectives',
        features: 'Core Features & MVP Requirements',
        tech: 'Technical Architecture & Schema',
        design: 'UI/UX Direction & Visual Brief',
        prompts: 'Ready-to-Use AI UI Prompts',
      },
      badges: {
        summary: 'Scope & Problem',
        features: 'Product Spec',
        tech: 'Engineering',
        design: 'Design System',
        prompts: 'v0 / Midjourney',
      },
      colorTokensTitle: 'Interactive Color Tokens',
      colorTokensSub: 'Click swatch to copy hex code',
      refinePromptPlaceholder: "E.g.: 'Switch to PostgreSQL', 'Add Google OAuth login'...",
      retry: 'Retry',
      close: 'Close',
    },
    history: {
      title: 'PRD History',
      subtitle: (count: number) => `${count} documents saved locally`,
      backupJson: 'Backup JSON',
      clearAll: 'Clear All',
      searchPlaceholder: 'Search history (ideas, keywords)...',
      emptyTitle: 'No history records yet',
      emptyDesc: 'PRDs you generate will automatically be saved here.',
      noMatch: (query: string) => `No results matching "${query}"`,
      resetSearch: 'Reset search',
      openBtn: 'Open',
      noSummary: 'No summary available.',
    },
  },
};

export function getStoredLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem('app_language');
    if (saved === 'id' || saved === 'en') return saved;
  } catch {
    // Ignore error
  }
  return 'id';
}

export function saveStoredLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem('app_language', lang);
  } catch {
    // Ignore error
  }
}
