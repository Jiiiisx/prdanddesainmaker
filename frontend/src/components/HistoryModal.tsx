import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trash2, ArrowUpRight, FolderOpen, Search, Download } from 'lucide-react';
import type { PRDHistoryItem, AppLanguage } from '../types';
import { exportHistoryJSON } from '../utils/historyStorage';
import { translations } from '../utils/translations';

interface HistoryModalProps {
  isOpen: boolean;
  history: PRDHistoryItem[];
  onClose: () => void;
  onSelect: (item: PRDHistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  language?: AppLanguage;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history,
  onClose,
  onSelect,
  onDelete,
  onClearAll,
  language = 'id',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[language].history;

  const filteredHistory = history.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const ideaMatch = item.idea.toLowerCase().includes(term);
    const summaryMatch = (item.sections.summary || '').toLowerCase().includes(term);
    return ideaMatch || summaryMatch;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#18181B]/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white border-2 border-[#18181B] shadow-[8px_8px_0px_0px_#18181B] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#18181B]/15 bg-[#FAF7F2]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border-1.5 border-[#18181B] shadow-[1.5px_1.5px_0px_0px_#18181B]">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#18181B]">{t.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{t.subtitle(history.length)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={exportHistoryJSON}
                      title="Unduh seluruh riwayat sebagai file JSON"
                      className="text-xs px-2.5 py-1.5 rounded-lg border-1.5 border-[#18181B] bg-white text-[#18181B] font-bold hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1"
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">{t.backupJson}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClearAll}
                      className="text-xs px-2.5 py-1.5 rounded-lg border-1.5 border-red-700 bg-red-50 text-red-700 font-bold hover:bg-red-100 shadow-[1.5px_1.5px_0px_0px_#B91C1C] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                      {t.clearAll}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-600 hover:text-black border-1.5 border-[#18181B] rounded-lg bg-white shadow-[1.5px_1.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Search filter bar */}
            {history.length > 0 && (
              <div className="px-6 pt-3 pb-1 bg-[#FAF7F2] border-b-2 border-[#18181B]/10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-1.5 border-[#18181B] shadow-[1.5px_1.5px_0px_0px_#18181B]">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-transparent text-xs text-[#18181B] outline-none font-medium placeholder-slate-400"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-slate-400 hover:text-slate-700 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#F6F3EE]/50">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <FolderOpen size={36} className="mx-auto text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">{t.emptyTitle}</p>
                  <p className="text-xs text-slate-500">{t.emptyDesc}</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-500 space-y-1">
                  <p className="text-xs font-bold">{t.noMatch(searchTerm)}</p>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-xs text-indigo-600 underline font-semibold"
                  >
                    {t.resetSearch}
                  </button>
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex items-start justify-between gap-4 p-4 rounded-xl bg-white border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#18181B] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    <div
                      className="flex-1 cursor-pointer pr-2"
                      onClick={() => onSelect(item)}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-[#18181B]">
                          {item.model}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-black text-[#18181B] line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {item.idea}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 font-normal">
                        {item.sections.summary || t.noSummary}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-center">
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white border-1.5 border-[#18181B] hover:bg-indigo-700 shadow-[1.5px_1.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                      >
                        {t.openBtn}
                        <ArrowUpRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-700 border-1.5 border-[#18181B] bg-white rounded-lg shadow-[1.5px_1.5px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
