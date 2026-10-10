import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowLeft,
  Download,
  Copy,
  Check,
  StopCircle,
  History,
  Compass,
  Boxes,
  CodeXml,
  Paintbrush,
  Sparkle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BentoCard } from './BentoCard';
import { ColorPaletteSection } from './ColorPaletteSection';
import { LanguageToggle } from './LanguageToggle';
import type { PRDSections, LLMModel, StreamMeta, AppLanguage } from '../types';
import { extractHexColors } from '../utils/streamParser';
import { translations } from '../utils/translations';

interface BentoPhaseProps {
  idea: string;
  model: LLMModel;
  streamMeta?: StreamMeta | null;
  sections: PRDSections;
  isStreaming: boolean;
  onUpdateIdea: (idea: string) => void;
  onUpdateModel: (model: LLMModel) => void;
  onGenerate: () => void;
  onStop: () => void;
  onBackToHero: () => void;
  onOpenHistory?: () => void;
  hasHistory?: boolean;
  onRefineSection?: (sectionKey: keyof PRDSections, instruction: string) => Promise<void>;
  refiningSection?: (keyof PRDSections) | null;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

export const BentoPhase: React.FC<BentoPhaseProps> = ({
  idea,
  model,
  streamMeta,
  sections,
  isStreaming,
  onUpdateIdea,
  onUpdateModel,
  onGenerate,
  onStop,
  onBackToHero,
  onOpenHistory,
  hasHistory = false,
  onRefineSection,
  refiningSection = null,
  language,
  onChangeLanguage,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [isBannerCollapsed, setIsBannerCollapsed] = useState(false);
  const t = translations[language].bento;

  const handleBackClick = () => {
    if (hasAnyContent) {
      setShowBackConfirm(true);
    } else {
      onBackToHero();
    }
  };

  const assembleFullMarkdown = () => {
    return [
      `# PRD & Design Brief: ${idea.slice(0, 50)}`,
      `*Generated on: ${new Date().toLocaleString()}*\n`,
      sections.summary,
      '\n---\n',
      sections.features,
      '\n---\n',
      sections.tech,
      '\n---\n',
      sections.design,
      '\n---\n',
      sections.prompts,
    ].join('\n\n');
  };

  const handleCopyAll = () => {
    const fullDoc = assembleFullMarkdown();
    navigator.clipboard.writeText(fullDoc);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const generateFileName = () => {
    // Generate clean slug from idea
    const slug = idea
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 35);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const prefix = slug || 'project';
    return `PRD_${prefix}_${dateStr}.md`;
  };

  const handleDownload = () => {
    const fullDoc = assembleFullMarkdown();
    const blob = new Blob([fullDoc], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Delighted user reward
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  const hasAnyContent = Boolean(
    sections.summary || sections.features || sections.tech || sections.design || sections.prompts
  );

  const colorTokens = extractHexColors(sections.design);

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 max-w-[1440px] mx-auto flex flex-col">
      {/* Top Sticky Navigation */}
      <header className="py-4 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#18181B]/15 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackClick}
            className="p-2 rounded-lg bg-white border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] text-[#18181B] hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Kembali ke tampilan awal"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.changeIdea}</span>
          </button>
          <div className="h-5 w-[2px] bg-[#18181B]/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#18181B] text-sm sm:text-base">
              Bento Workspace
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 border-1.5 border-[#18181B] shadow-[1px_1px_0px_0px_#18181B] text-indigo-700 font-bold">
              {model}
            </span>
            {streamMeta && streamMeta.provider === '9router' && streamMeta.requestedModel !== 'Utama' && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-[#18181B] font-semibold"
                title={`Dialihkan via 9Router (${streamMeta.effectiveModel}) karena API key langsung tidak diset di .env`}
              >
                routed
              </span>
            )}
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <LanguageToggle language={language} onChangeLanguage={onChangeLanguage} />

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] text-xs font-bold text-[#18181B] hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              title="Buka Riwayat PRD"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.historyBtn}</span>
              {hasHistory && <span className="w-2 h-2 rounded-full bg-indigo-600 border border-black" />}
            </button>
          )}

          {hasAnyContent && (
            <>
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] text-xs font-bold text-[#18181B] hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.copiedMd}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copyFullMd}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 border-2 border-[#18181B] shadow-[2.5px_2.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.exportMd}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Top Collapsible Control Banner */}
      <section className="mb-6 w-full bg-white border-2 border-[#18181B] rounded-2xl shadow-[4px_4px_0px_0px_#18181B] overflow-hidden transition-all shrink-0">
        {isBannerCollapsed ? (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-[#FAF7F2]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border-1.5 border-[#18181B] shadow-[1px_1px_0px_0px_#18181B] shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-[#18181B] truncate">
                <span className="text-slate-400 font-semibold mr-1.5">Ide:</span>
                "{idea || 'Belum ada ide'}"
              </p>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-[#18181B] font-bold">
                {model}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBannerCollapsed(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-1.5 border-[#18181B] bg-white text-xs font-bold text-[#18181B] hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <span>{t.openBanner}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#18181B]/15">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border-1.5 border-[#18181B] shadow-[1.5px_1.5px_0px_0px_#18181B]">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#18181B] text-sm sm:text-base">{t.bannerTitle}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{t.bannerSub}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBannerCollapsed(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-1.5 border-[#18181B] bg-white text-[11px] font-bold text-slate-600 hover:text-black hover:bg-slate-50 shadow-[1px_1px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                title="Sembunyikan panel kontrol"
              >
                <span>{t.collapseBanner}</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              <div className="md:col-span-7">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t.rawIdeaLabel}
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => onUpdateIdea(e.target.value)}
                  disabled={isStreaming}
                  rows={2}
                  placeholder={t.rawIdeaPlaceholder}
                  className="w-full bg-white border-2 border-[#18181B] rounded-xl p-2.5 text-xs sm:text-sm text-[#18181B] outline-none resize-none disabled:opacity-60 leading-relaxed focus:shadow-[3px_3px_0px_0px_#4F46E5]"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t.modelLabel}
                </label>
                <select
                  value={model}
                  onChange={(e) => onUpdateModel(e.target.value as LLMModel)}
                  disabled={isStreaming}
                  className="w-full bg-white border-2 border-[#18181B] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#18181B] font-semibold outline-none disabled:opacity-60 cursor-pointer focus:shadow-[3px_3px_0px_0px_#4F46E5] h-[46px]"
                >
                  <option value="Utama">Utama (9Router Gemini Pro Combo)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gpt-4o">OpenAI GPT-4o</option>
                  <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                </select>
              </div>

              <div className="md:col-span-2">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={onStop}
                    className="w-full h-[46px] px-3 rounded-xl font-bold text-xs text-red-700 bg-red-100 hover:bg-red-200 border-2 border-[#18181B] shadow-[2.5px_2.5px_0px_0px_#18181B] inline-flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <StopCircle className="w-4 h-4 shrink-0" />
                    <span>{t.stopStream}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onGenerate}
                    disabled={!idea.trim()}
                    className="w-full h-[46px] px-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#18181B] disabled:opacity-50 inline-flex items-center justify-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{hasAnyContent ? t.regenerate : t.generate}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Pure 5-Card Full-Width Bento Grid Workspace */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 w-full">
        {/* BENTO 1: SUMMARY & TARGET USERS (Full Width 12-col) */}
        <BentoCard
          title={t.titles.summary}
          badge={t.badges.summary}
          icon={<Compass className="w-4 h-4" />}
          content={sections.summary}
          isStreaming={isStreaming && !sections.features}
          className="md:col-span-12 min-h-[220px]"
          onRefine={onRefineSection ? (inst) => onRefineSection('summary', inst) : undefined}
          isRefining={refiningSection === 'summary'}
          emptyText={t.emptyCard}
          refinePlaceholder={t.refinePromptPlaceholder}
        />

        {/* BENTO 2: CORE FEATURES & SCOPE (Col 1-7) */}
        <BentoCard
          title={t.titles.features}
          badge={t.badges.features}
          icon={<Boxes className="w-4 h-4" />}
          content={sections.features}
          isStreaming={isStreaming && Boolean(sections.summary) && !sections.tech}
          className="md:col-span-7 min-h-[300px]"
          onRefine={onRefineSection ? (inst) => onRefineSection('features', inst) : undefined}
          isRefining={refiningSection === 'features'}
          emptyText={t.emptyCard}
          refinePlaceholder={t.refinePromptPlaceholder}
        />

        {/* BENTO 3: TECHNICAL ARCHITECTURE & API (Col 8-12) */}
        <BentoCard
          title={t.titles.tech}
          badge={t.badges.tech}
          icon={<CodeXml className="w-4 h-4" />}
          content={sections.tech}
          isStreaming={isStreaming && Boolean(sections.features) && !sections.design}
          className="md:col-span-5 min-h-[300px]"
          onRefine={onRefineSection ? (inst) => onRefineSection('tech', inst) : undefined}
          isRefining={refiningSection === 'tech'}
          emptyText={t.emptyCard}
          refinePlaceholder={t.refinePromptPlaceholder}
        />

        {/* BENTO 4: UI/UX DIRECTION & COLOR PALETTE (Col 1-6) */}
        <BentoCard
          title={t.titles.design}
          badge={t.badges.design}
          icon={<Paintbrush className="w-4 h-4" />}
          content={sections.design}
          isStreaming={isStreaming && Boolean(sections.tech) && !sections.prompts}
          className="md:col-span-6 min-h-[260px]"
          onRefine={onRefineSection ? (inst) => onRefineSection('design', inst) : undefined}
          isRefining={refiningSection === 'design'}
          emptyText={t.emptyCard}
          refinePlaceholder={t.refinePromptPlaceholder}
        >
          {sections.design && (
            <ColorPaletteSection
              colors={colorTokens}
              title={t.colorTokensTitle}
              subtitle={t.colorTokensSub}
              copiedText={t.copiedMd}
            />
          )}
        </BentoCard>

        {/* BENTO 5: READY-TO-USE PROMPTS (Col 7-12) */}
        <BentoCard
          title={t.titles.prompts}
          badge={t.badges.prompts}
          icon={<Sparkle className="w-4 h-4" />}
          content={sections.prompts}
          isStreaming={isStreaming && Boolean(sections.design)}
          className="md:col-span-6 min-h-[260px]"
          onRefine={onRefineSection ? (inst) => onRefineSection('prompts', inst) : undefined}
          isRefining={refiningSection === 'prompts'}
          emptyText={t.emptyCard}
          refinePlaceholder={t.refinePromptPlaceholder}
        />
      </main>

      {/* Confirmation modal before navigating away from active PRD */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-xs">
          <div className="bg-white border-2 border-[#18181B] rounded-2xl p-5 shadow-[6px_6px_0px_0px_#18181B] max-w-sm w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-extrabold text-[#18181B] text-base">{t.confirmTitle}</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t.confirmDesc}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#18181B]/10">
              <button
                type="button"
                onClick={() => setShowBackConfirm(false)}
                className="px-3 py-1.5 rounded-lg border-1.5 border-[#18181B] bg-white text-xs font-bold text-[#18181B] hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                {t.stayBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBackConfirm(false);
                  onBackToHero();
                }}
                className="px-3 py-1.5 rounded-lg border-1.5 border-[#18181B] bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-[1.5px_1.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                {t.proceedBackBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
