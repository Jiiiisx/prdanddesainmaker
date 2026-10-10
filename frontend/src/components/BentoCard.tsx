import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Maximize2, Minimize2, Loader2, Sparkles, CornerDownLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BentoCardProps {
  title: string;
  badge?: string;
  icon: React.ReactNode;
  content: string;
  isStreaming?: boolean;
  className?: string;
  children?: React.ReactNode;
  onRefine?: (instruction: string) => Promise<void>;
  isRefining?: boolean;
  emptyText?: string;
  refinePlaceholder?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  title,
  badge,
  icon,
  content,
  isStreaming = false,
  className = '',
  children,
  onRefine,
  isRefining = false,
  emptyText,
  refinePlaceholder,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [instruction, setInstruction] = useState('');

  // Lock body scroll and listen for Escape key on fullscreen mode
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isExpanded]);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isRefining || !onRefine) return;
    const task = instruction.trim();
    setInstruction('');
    setShowRefineInput(false);
    await onRefine(task);
  };

  return (
    <>
      <motion.div
        layout
        className={`bg-white border-2 border-[#18181B] rounded-2xl p-4 sm:p-5 flex flex-col shadow-[4px_4px_0px_0px_#18181B] relative overflow-hidden transition-all ${className} ${
          isExpanded
            ? 'fixed inset-4 sm:inset-10 z-50 overflow-y-auto shadow-[10px_10px_0px_0px_#18181B] max-h-none'
            : 'max-h-[540px]'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#18181B]/15 mb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border-1.5 border-[#18181B] shadow-[1.5px_1.5px_0px_0px_#18181B] shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#18181B] text-sm sm:text-base truncate">
                  {title}
                </h3>
                {badge && (
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#FAF7F2] text-[#18181B] border-1.5 border-[#18181B] shadow-[1px_1px_0px_0px_#18181B]">
                    {badge}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(isStreaming || isRefining) && (
              <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 px-2 py-0.5 rounded-md bg-indigo-50 border-1.5 border-[#18181B] font-bold shadow-[1px_1px_0px_0px_#18181B]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{isRefining ? 'Merevisi...' : 'Streaming'}</span>
              </span>
            )}

            {/* AI Refine trigger */}
            {content && onRefine && (
              <button
                type="button"
                onClick={() => setShowRefineInput(!showRefineInput)}
                title="Edit bagian ini dengan AI"
                className={`p-1.5 rounded-lg border-1.5 border-[#18181B] shadow-[1.5px_1.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${
                  showRefineInput
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}

            {content && (
              <button
                type="button"
                onClick={handleCopy}
                title="Salin bagian ini"
                className="p-1.5 rounded-lg border-1.5 border-[#18181B] bg-white text-[#18181B] hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Kecilkan' : 'Perbesar kartu'}
              className="p-1.5 rounded-lg border-1.5 border-[#18181B] bg-white text-[#18181B] hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* In-place Refine Micro-bar */}
        <AnimatePresence>
          {showRefineInput && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleRefineSubmit}
              className="mb-3 overflow-hidden"
            >
              <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#FAF7F2] border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B]">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder={refinePlaceholder || "Misal: 'Ganti ke PostgreSQL', 'Tambahkan login Google'..."}
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs text-[#18181B] placeholder-slate-400 outline-none font-medium"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!instruction.trim() || isRefining}
                  className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 border-1.5 border-[#18181B] shadow-[1px_1px_0px_0px_#18181B] disabled:opacity-40 transition-colors"
                  title="Kirim instruksi edit"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowRefineInput(false)}
                  className="p-1.5 text-slate-500 hover:text-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Card Body */}
        <div className="flex-1 overflow-y-auto pr-1 text-slate-800 text-sm leading-relaxed">
          {content ? (
            <div className="bento-prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : isStreaming ? (
            <div className="space-y-2 py-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded-md w-3/4 border border-[#18181B]/20" />
              <div className="h-3.5 bg-slate-200 rounded-md w-full border border-[#18181B]/20" />
              <div className="h-3.5 bg-slate-200 rounded-md w-5/6 border border-[#18181B]/20" />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center py-6 text-slate-400 text-xs font-semibold">
              {emptyText || 'Belum ada data. Klik tombol Generate untuk mengisi.'}
            </div>
          )}

          {children}
        </div>
      </motion.div>

      {/* Dimmed backdrop when card is expanded full screen */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-[#18181B]/40 backdrop-blur-xs z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};
