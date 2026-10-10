import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CornerDownLeft, History } from 'lucide-react';
import type { AppLanguage } from '../types';
import { LanguageToggle } from './LanguageToggle';
import { translations } from '../utils/translations';

interface HeroPhaseProps {
  initialIdea: string;
  onProceed: (idea: string) => void;
  onOpenHistory?: () => void;
  hasHistory?: boolean;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

export const HeroPhase: React.FC<HeroPhaseProps> = ({
  initialIdea,
  onProceed,
  onOpenHistory,
  hasHistory = false,
  language,
  onChangeLanguage,
}) => {
  const [idea, setIdea] = useState(initialIdea);
  const t = translations[language].hero;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (idea.trim()) {
      onProceed(idea.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 max-w-4xl mx-auto w-full">
      {/* Brand pill & Language / History Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] text-xs font-bold text-[#18181B]">
          <span>AI PRD & Design Brief Generator</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-[11px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">v2.2</span>
        </div>

        <LanguageToggle language={language} onChangeLanguage={onChangeLanguage} />

        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] text-xs font-bold text-[#18181B] hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            title="Buka Riwayat PRD"
          >
            <History size={13} className="text-indigo-600" />
            <span>{t.historyBtn}</span>
            {hasHistory && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 border border-black" />
            )}
          </button>
        )}
      </motion.div>

      {/* Main Headline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#18181B] leading-tight">
          {t.tagline1} <br className="hidden sm:inline" />
          <span className="relative inline-block mt-1">
            <span className="relative z-10 text-indigo-600">{t.tagline2}</span>
            <span className="absolute left-0 bottom-1 sm:bottom-2 w-full h-3 sm:h-4 bg-indigo-100 -z-0 border-b-2 border-indigo-300" />
          </span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto font-medium">
          {t.subtitle}
        </p>
      </motion.div>

      {/* Hero Input Box */}
      <motion.div
        layoutId="main-idea-input"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full bg-white border-2 border-[#18181B] rounded-2xl p-4 sm:p-5 shadow-[6px_6px_0px_0px_#18181B]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.inputPlaceholder}
              rows={3}
              className="w-full bg-transparent resize-none outline-none text-[#18181B] placeholder-slate-400 text-base sm:text-lg p-2 font-normal leading-relaxed"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between border-t-2 border-[#18181B]/10 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>{t.enterHint}</span>
            </div>

            <button
              type="submit"
              disabled={!idea.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#18181B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <span>{t.proceedBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>

      {/* Suggestions Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 w-full max-w-3xl"
      >
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <span>{t.quickInspiration}</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {t.suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setIdea(item.prompt);
              }}
              className="px-3 py-1.5 rounded-lg bg-white border-1.5 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] text-xs sm:text-sm font-semibold text-[#18181B] hover:bg-indigo-50 hover:text-indigo-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-left"
            >
              + {item.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
