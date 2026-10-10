import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AmbientBackground } from './components/AmbientBackground';
import { HeroPhase } from './components/HeroPhase';
import { ClarificationPhase } from './components/ClarificationPhase';
import { BentoPhase } from './components/BentoPhase';
import { HistoryModal } from './components/HistoryModal';
import type {
  AppPhase,
  LLMModel,
  PRDSections,
  PRDHistoryItem,
  ClarificationTurn,
  ClarifyInterviewResponse,
  StreamMeta,
  AppLanguage,
} from './types';
import { parseStreamToSections } from './utils/streamParser';
import {
  loadHistory,
  saveHistoryItem,
  deleteHistoryItem,
  clearHistory,
} from './utils/historyStorage';
import { getStoredLanguage, saveStoredLanguage } from './utils/translations';

const initialSections: PRDSections = {
  summary: '',
  features: '',
  tech: '',
  design: '',
  prompts: '',
};

export function App() {
  const [phase, setPhase] = useState<AppPhase>('hero');
  const [language, setLanguage] = useState<AppLanguage>(() => getStoredLanguage());
  const [idea, setIdea] = useState<string>('');
  const [model, setModel] = useState<LLMModel>('Utama');
  const [streamMeta, setStreamMeta] = useState<StreamMeta | null>(null);
  const [sections, setSections] = useState<PRDSections>(initialSections);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLanguageChange = (newLang: AppLanguage) => {
    setLanguage(newLang);
    saveStoredLanguage(newLang);
  };

  // Clarification Discovery States
  const [clarificationHistory, setClarificationHistory] = useState<ClarificationTurn[]>([]);
  const [interviewData, setInterviewData] = useState<ClarifyInterviewResponse | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState<boolean>(false);

  // In-place refinement state
  const [refiningSection, setRefiningSection] = useState<(keyof PRDSections) | null>(null);

  const [history, setHistory] = useState<PRDHistoryItem[]>(() => loadHistory());
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const latestSectionsRef = useRef<PRDSections>(initialSections);

  // Sync ref
  useEffect(() => {
    latestSectionsRef.current = sections;
  }, [sections]);

  // Stop stream if unmounted
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Request next clarification question from AI
  const fetchNextInterviewQuestion = async (
    targetIdea: string,
    currentTurns: ClarificationTurn[]
  ) => {
    setIsInterviewLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/clarify-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: targetIdea,
          history: currentTurns,
          model,
          language,
        }),
      });
      if (!res.ok) throw new Error(`Interview error ${res.status}`);
      const data: ClarifyInterviewResponse = await res.json();
      setInterviewData(data);
    } catch {
      // Graceful fallback: Proceed directly if interview failed
      setPhase('bento');
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const handleHeroProceed = (enteredIdea: string) => {
    setIdea(enteredIdea);
    setClarificationHistory([]);
    setInterviewData(null);
    setPhase('clarification');
    void fetchNextInterviewQuestion(enteredIdea, []);
  };

  const handleAnswerClarification = (answer: string) => {
    if (!interviewData?.nextQuestion) return;
    const newTurn: ClarificationTurn = {
      question: interviewData.nextQuestion.question,
      answer,
    };
    const updatedHistory = [...clarificationHistory, newTurn];
    setClarificationHistory(updatedHistory);

    // If AI already declared sufficient or high score, or completed all 3 turns, move to bento
    if (interviewData.isSufficient || interviewData.readinessScore >= 85 || updatedHistory.length >= 3) {
      setPhase('bento');
      void executeGenerate(idea, updatedHistory);
    } else {
      void fetchNextInterviewQuestion(idea, updatedHistory);
    }
  };

  const handleProceedDirectlyToBento = () => {
    setPhase('bento');
    void executeGenerate(idea, clarificationHistory);
  };

  const executeGenerate = async (targetIdea: string, turns: ClarificationTurn[]) => {
    if (!targetIdea.trim() || isStreaming) return;

    setErrorMessage(null);
    setIsStreaming(true);
    setSections(initialSections);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: targetIdea.trim(),
          model,
          language,
          clarifications: turns,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Readable stream not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamBuffer = '';
      let partialLine = '';
      let currentEvent = 'chunk';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunkText).split('\n');
        partialLine = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            continue;
          }
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            if (!rawData) continue;

            try {
              const parsed = JSON.parse(rawData);
              if (currentEvent === 'meta' || parsed.provider) {
                setStreamMeta(parsed as StreamMeta);
              } else if (parsed.chunk) {
                streamBuffer += parsed.chunk;
                setSections(parseStreamToSections(streamBuffer));
              } else if (parsed.error) {
                setErrorMessage(parsed.error);
              }
            } catch {
              if (rawData !== '[DONE]') {
                streamBuffer += rawData;
                setSections(parseStreamToSections(streamBuffer));
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User stopped
      } else {
        const msg = err instanceof Error ? err.message : 'Gagal menghasilkan PRD';
        setErrorMessage(msg);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;

      const finalSections = latestSectionsRef.current;
      const hasContent = Boolean(
        finalSections.summary ||
        finalSections.features ||
        finalSections.tech ||
        finalSections.design ||
        finalSections.prompts
      );

      if (hasContent && targetIdea.trim()) {
        const updatedHistory = saveHistoryItem({
          idea: targetIdea.trim(),
          model,
          sections: finalSections,
        });
        setHistory(updatedHistory);
      }
    }
  };

  const handleGenerate = async () => {
    await executeGenerate(idea, clarificationHistory);
  };

  // In-place refinement handler
  const handleRefineSection = async (sectionKey: keyof PRDSections, instruction: string) => {
    if (refiningSection || isStreaming) return;
    setRefiningSection(sectionKey);
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/refine-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey,
          currentContent: sections[sectionKey],
          instruction,
          model,
          language,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Refine error: ${response.status}`);
      if (!response.body) throw new Error('Readable stream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let refinedText = '';
      let partialLine = '';
      let currentEvent = 'chunk';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunkText).split('\n');
        partialLine = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            continue;
          }
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            if (!rawData) continue;

            try {
              const parsed = JSON.parse(rawData);
              if (currentEvent === 'meta' || parsed.provider) {
                setStreamMeta(parsed as StreamMeta);
              } else if (parsed.chunk) {
                refinedText += parsed.chunk;
                setSections((prev) => ({
                  ...prev,
                  [sectionKey]: refinedText,
                }));
              } else if (parsed.error) {
                setErrorMessage(parsed.error);
              }
            } catch {
              if (rawData !== '[DONE]') {
                refinedText += rawData;
                setSections((prev) => ({
                  ...prev,
                  [sectionKey]: refinedText,
                }));
              }
            }
          }
        }
      }

      // Save updated document to storage
      if (idea.trim()) {
        const updatedSections = {
          ...latestSectionsRef.current,
          [sectionKey]: refinedText,
        };
        const updatedHistory = saveHistoryItem({
          idea: idea.trim(),
          model,
          sections: updatedSections,
        });
        setHistory(updatedHistory);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Stopped
      } else {
        const msg = err instanceof Error ? err.message : 'Gagal merevisi kartu ini';
        setErrorMessage(msg);
      }
    } finally {
      setRefiningSection(null);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSelectHistoryItem = (item: PRDHistoryItem) => {
    setIdea(item.idea);
    setModel(item.model);
    setSections(item.sections);
    setPhase('bento');
    setIsHistoryOpen(false);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleClearAllHistory = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="relative min-h-screen text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      <AmbientBackground />

      <HistoryModal
        isOpen={isHistoryOpen}
        history={history}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectHistoryItem}
        onDelete={handleDeleteHistoryItem}
        onClearAll={handleClearAllHistory}
        language={language}
      />

      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center gap-3">
          <span>{errorMessage}</span>
          {phase === 'bento' && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                void handleGenerate();
              }}
              className="px-2 py-0.5 rounded bg-white text-red-700 font-bold hover:bg-red-50 text-[11px] border border-black shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              {language === 'en' ? 'Retry' : 'Coba Lagi'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="underline hover:text-red-100"
          >
            {language === 'en' ? 'Close' : 'Tutup'}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'hero' ? (
          <motion.div
            key="hero-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <HeroPhase
              initialIdea={idea}
              onProceed={handleHeroProceed}
              onOpenHistory={() => setIsHistoryOpen(true)}
              hasHistory={history.length > 0}
              language={language}
              onChangeLanguage={handleLanguageChange}
            />
          </motion.div>
        ) : phase === 'clarification' ? (
          <motion.div
            key="clarification-view"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ClarificationPhase
              idea={idea}
              interviewData={interviewData}
              history={clarificationHistory}
              isLoading={isInterviewLoading}
              onSubmitAnswer={handleAnswerClarification}
              onProceedDirectly={handleProceedDirectlyToBento}
              onBackToHero={() => setPhase('hero')}
              language={language}
              onChangeLanguage={handleLanguageChange}
            />
          </motion.div>
        ) : (
          <motion.div
            key="bento-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BentoPhase
              idea={idea}
              model={model}
              streamMeta={streamMeta}
              sections={sections}
              isStreaming={isStreaming}
              onUpdateIdea={setIdea}
              onUpdateModel={setModel}
              onGenerate={handleGenerate}
              onStop={handleStop}
              onBackToHero={() => setPhase('hero')}
              onOpenHistory={() => setIsHistoryOpen(true)}
              hasHistory={history.length > 0}
              onRefineSection={handleRefineSection}
              refiningSection={refiningSection}
              language={language}
              onChangeLanguage={handleLanguageChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
