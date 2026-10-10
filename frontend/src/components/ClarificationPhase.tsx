import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Loader2,
  FastForward,
  MessageSquareQuote,
  Lightbulb,
  Image as ImageIcon,
  Link2,
  Trash2,
  Paintbrush,
  CodeXml,
  Workflow,
  Palette,
} from 'lucide-react';
import type { ClarificationTurn, ClarifyInterviewResponse, AppLanguage } from '../types';
import { extractColorsFromImage } from '../utils/colorExtractor';
import { LanguageToggle } from './LanguageToggle';
import { translations } from '../utils/translations';

interface ClarificationPhaseProps {
  idea: string;
  interviewData: ClarifyInterviewResponse | null;
  history: ClarificationTurn[];
  isLoading: boolean;
  onSubmitAnswer: (answer: string) => void;
  onProceedDirectly: () => void;
  onBackToHero: () => void;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

export const ClarificationPhase: React.FC<ClarificationPhaseProps> = ({
  idea,
  interviewData,
  history,
  isLoading,
  onSubmitAnswer,
  onProceedDirectly,
  onBackToHero,
  language,
  onChangeLanguage,
}) => {
  const [selectedChip, setSelectedChip] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const t = translations[language].clarification;

  // Design Inspiration Hub states (Turn 3 / Design stage)
  const [referenceUrl, setReferenceUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
  const [isExtractingColors, setIsExtractingColors] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const category =
    interviewData?.nextQuestion?.category ||
    (history.length === 1 ? 'tech_stack' : history.length === 2 ? 'design' : 'workflow');
  const isDesignStage = category === 'design';

  // Process image file and extract dominant colors via canvas
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsExtractingColors(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      const colors = await extractColorsFromImage(dataUrl);
      setExtractedPalette(colors);
      setIsExtractingColors(false);
    };
    reader.readAsDataURL(file);
  };

  // Clipboard Paste listener (Ctrl+V image paste on design stage)
  useEffect(() => {
    if (!isDesignStage) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            void processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isDesignStage]);

  const currentAnswer = customText.trim() || selectedChip;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentAnswer && !referenceUrl.trim() && extractedPalette.length === 0) return;
    if (isLoading) return;

    let finalAnswer = currentAnswer || 'Preferensi visual disesuaikan dengan referensi inspirasi';
    if (referenceUrl.trim()) {
      finalAnswer += ` (Referensi Desain Website: ${referenceUrl.trim()})`;
    }
    if (extractedPalette.length > 0) {
      finalAnswer += ` (Palet Warna Ekstraksi Poster/Foto: ${extractedPalette.join(', ')})`;
    }

    onSubmitAnswer(finalAnswer);
    setSelectedChip('');
    setCustomText('');
    setReferenceUrl('');
    setImagePreview(null);
    setExtractedPalette([]);
  };

  const handleChipClick = (opt: string) => {
    if (selectedChip === opt) {
      setSelectedChip('');
    } else {
      setSelectedChip(opt);
      setCustomText('');
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setExtractedPalette([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readiness = interviewData?.readinessScore ?? 30;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 max-w-3xl mx-auto w-full">
      {/* Top Navigator & Progress */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToHero}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] text-xs font-bold text-[#18181B] hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ArrowLeft size={14} />
            <span>{t.backToIdea}</span>
          </button>
          <LanguageToggle language={language} onChangeLanguage={onChangeLanguage} />
        </div>

        {/* Readiness Bar */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {t.clarityScore}
            </div>
            <div className="text-xs font-black text-indigo-700 font-mono">
              {readiness}{t.readySuffix}
            </div>
          </div>
          <div className="w-24 sm:w-32 h-3 bg-white rounded-md overflow-hidden p-0.5 border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B]">
            <motion.div
              className="h-full bg-indigo-600 rounded-xs"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(15, readiness))}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Main Neobrutalism Interrogation Card */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full bg-white border-2 border-[#18181B] rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#18181B] flex flex-col gap-6 relative overflow-hidden"
      >
        {/* Ide Context Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F6F3EE] border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B]">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs shrink-0 mt-0.5 border border-[#18181B]">
            <MessageSquareQuote size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider block">
              {t.contextLabel}
            </span>
            <p className="text-xs sm:text-sm font-semibold text-[#18181B] line-clamp-2 mt-0.5">
              "{idea}"
            </p>
          </div>
        </div>

        {/* AI Observation Insight */}
        {interviewData?.aiObservation && (
          <div className="text-xs text-[#18181B] bg-amber-50 px-3.5 py-2.5 rounded-xl border-1.5 border-[#18181B] flex items-start gap-2 shadow-[2px_2px_0px_0px_#18181B]">
            <Lightbulb size={15} className="text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{interviewData.aiObservation}</span>
          </div>
        )}

        {/* Dynamic Question Area */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-600">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <span className="text-xs font-bold animate-pulse">
              {t.analyzing}
            </span>
          </div>
        ) : interviewData?.nextQuestion ? (
          <div className="flex flex-col gap-4">
            {/* Stage Pill Indicator */}
            <div className="flex items-center gap-2">
              {category === 'workflow' ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-[#18181B] shadow-[1px_1px_0px_0px_#18181B]">
                  <Workflow size={12} />
                  <span>{t.stage1}</span>
                </span>
              ) : category === 'tech_stack' ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-[#18181B] shadow-[1px_1px_0px_0px_#18181B]">
                  <CodeXml size={12} />
                  <span>{t.stage2}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-pink-50 text-pink-800 border border-[#18181B] shadow-[1px_1px_0px_0px_#18181B]">
                  <Paintbrush size={12} />
                  <span>{t.stage3}</span>
                </span>
              )}
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800 border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] shrink-0 mt-0.5">
                <HelpCircle size={18} />
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#18181B] leading-snug">
                {interviewData.nextQuestion.question}
              </h2>
            </div>

            {/* Dynamic Suggestion Chips */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t.aiOptionsLabel}
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {interviewData.nextQuestion.suggestedOptions.map((opt, idx) => {
                  const isSelected = selectedChip === opt;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(opt)}
                      className={`text-left p-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-3 border-2 border-[#18181B] ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-[3px_3px_0px_0px_#18181B] translate-x-[-1px] translate-y-[-1px]'
                          : 'bg-white hover:bg-slate-50 text-[#18181B] shadow-[2px_2px_0px_0px_#18181B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected ? (
                        <CheckCircle2 size={16} className="text-white shrink-0" />
                      ) : (
                        <span className="text-slate-400 font-mono text-xs shrink-0">#{idx + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DESIGN INSPIRATION HUB (Only active on Stage 3: Design) */}
            {isDesignStage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-4 rounded-xl bg-[#FAF7F2] border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#18181B] flex flex-col gap-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette size={16} className="text-indigo-600" />
                    <span className="text-xs font-black text-[#18181B] uppercase tracking-wider">
                      {t.inspirationHubTitle}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-[#18181B]">
                    {t.inspirationBadge}
                  </span>
                </div>

                {/* Website Link Input */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border-1.5 border-[#18181B] shadow-[1px_1px_0px_0px_#18181B]">
                  <Link2 size={14} className="text-slate-400 shrink-0 ml-1" />
                  <input
                    type="url"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    placeholder={t.urlPlaceholder}
                    className="w-full bg-transparent text-xs text-[#18181B] outline-none font-medium placeholder-slate-400"
                  />
                </div>

                {/* Image Upload & Clipboard Paste Zone */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void processImageFile(file);
                    }}
                    className="hidden"
                  />

                  {!imagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#18181B]/40 hover:border-[#18181B] bg-white hover:bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center"
                    >
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-[#18181B]">
                        <ImageIcon size={18} />
                      </div>
                      <p className="text-xs font-bold text-[#18181B]">
                        {t.dropzoneText}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {t.dropzoneSub}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border-1.5 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600">{t.uploadedLabel}</span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 font-bold"
                        >
                          <Trash2 size={12} />
                          <span>{t.removeImage}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <img
                          src={imagePreview}
                          alt="Inspirasi Desain"
                          className="w-16 h-16 object-cover rounded-lg border-2 border-[#18181B] shadow-[1.5px_1.5px_0px_0px_#18181B] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          {isExtractingColors ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Loader2 size={12} className="animate-spin" />
                              <span>{t.extractingPalette}</span>
                            </div>
                          ) : extractedPalette.length > 0 ? (
                            <div>
                              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                                {t.paletteExtractedLabel}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {extractedPalette.map((hex, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#18181B] shadow-[1px_1px_0px_0px_#18181B]"
                                  >
                                    <div
                                      className="w-3.5 h-3.5 rounded-sm border border-black shrink-0"
                                      style={{ backgroundColor: hex }}
                                    />
                                    <span className="text-[10px] font-mono font-bold text-[#18181B]">
                                      {hex}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">{t.imageReady}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Custom Input */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
              <div className="relative">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedChip('');
                    }
                  }}
                  placeholder={t.customInputPlaceholder}
                  className="w-full bg-white border-2 border-[#18181B] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#18181B] outline-none placeholder-slate-400 focus:shadow-[3px_3px_0px_0px_#4F46E5]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onProceedDirectly}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-1.5 border-[#18181B] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-[2px_2px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                >
                  <FastForward size={14} />
                  <span>{t.skipBtn}</span>
                </button>

                <button
                  type="submit"
                  disabled={(!currentAnswer && !referenceUrl.trim() && extractedPalette.length === 0) || isLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#18181B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <span>{isDesignStage ? t.finishBtn : t.nextBtn}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Ready state */
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#18181B]">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#18181B]">
                {t.discoveryCompleteTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 font-medium">
                {t.discoveryCompleteSub}
              </p>
            </div>
            <button
              type="button"
              onClick={onProceedDirectly}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 border-2 border-[#18181B] shadow-[4px_4px_0px_0px_#18181B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <Sparkles size={16} />
              <span>{t.buildBentoBtn}</span>
            </button>
          </div>
        )}

        {/* History Accordion if any */}
        {history.length > 0 && (
          <div className="border-t-2 border-[#18181B]/15 pt-4 mt-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">
              {t.agreedDecisions} ({history.length}):
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {history.map((h, i) => (
                <div key={i} className="text-[11px] p-2.5 rounded-lg bg-[#FAF7F2] border-1.5 border-[#18181B] shadow-[1px_1px_0px_0px_#18181B] text-[#18181B]">
                  <span className="font-bold text-[#18181B]">Q:</span> {h.question} <br />
                  <span className="font-bold text-indigo-700">A:</span> {h.answer}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
