'use client';

import { useCallback, useState, useEffect, useRef, ReactNode } from 'react';
import { CategoryId, Score } from '@/types';
import { categories } from '@/data/categories';
import TraceArea, { TraceAreaHandle } from './TraceArea';
import EmojiExplosion from './EmojiExplosion';
import { useCoverageTracking } from '@/hooks/useCoverageTracking';
import { useWordQueue } from '@/hooks/useWordQueue';
import { useSpeech } from '@/hooks/useSpeech';
import { useSettings } from '@/hooks/useSettings';

interface GameScreenProps {
  categoryId: CategoryId;
  onBack: () => void;
  /** The hold-to-open Settings button; rendered inside the header so it never overlaps it. */
  settingsSlot?: ReactNode;
}

/**
 * Dev Notes: Game screen layout (see docs/DESIGN.md)
 *
 * A flex column that fills the visible viewport (parent is `.app-height`):
 *   1. Header      (shrink-0)  Back | category | score stars | Settings
 *   2. Word row    (shrink-0)  emoji + WORD + "Say it", letter progress pills
 *   3. Trace area  (flex-1 min-h-0)  absorbs ALL leftover height, never overflows
 *   4. Action bar  (shrink-0)  Undo | Start Over | Check
 * Only the trace area flexes, so on any iPad size (including a shortened Safari
 * viewport) the header and action bar are always on screen. Every button pairs
 * an emoji icon with a short text label for early readers.
 *
 * Game flow: useWordQueue picks the word; useCoverageTracking owns letter
 * progress; TraceArea owns ink. Remounting TraceArea (traceKey) clears ink.
 */
export default function GameScreen({ categoryId, onBack, settingsSlot }: GameScreenProps) {
  const category = categories[categoryId];

  // Settings from context
  const { settings, addLetterPoint, addWordPoint, incrementWordsCompleted } = useSettings();

  // Word queue for random word selection
  const { currentWord, nextWord, wordsCompleted } = useWordQueue({
    words: category.items,
    maxLetters: 6,
  });

  // Session score tracking (also updates persisted scores)
  const [score, setScore] = useState<Score>({ letterPoints: 0, wordPoints: 0 });

  // Showing celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  // Red flash state for incomplete check
  const [showRedFlash, setShowRedFlash] = useState(false);

  // Key to force TraceArea remount on word change
  const [traceKey, setTraceKey] = useState(0);

  // Speech synthesis (uses settings.speechEnabled)
  const { speakWord, speakLockedLetter, speakIncomplete, speakCelebration } = useSpeech(settings.speechEnabled);

  // Ref to store the current word for callbacks
  const currentWordRef = useRef(currentWord);
  useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);

  // Throttle ref for locked letter speech (prevent spam)
  const lastLockedSpeechRef = useRef(0);

  // Coverage tracking hook (uses settings.completionThreshold)
  const {
    currentLetterIndex,
    completedLetters,
    coveragePercentages,
    markSegmentCovered,
    finalizePendingAdvance,
    resetTracking,
    resetCurrentLetter,
    resetForNewWord,
    isWordComplete,
  } = useCoverageTracking({
    wordLength: currentWord?.word.length || 0,
    completionThreshold: settings.completionThreshold,
    onLetterComplete: () => {
      // Award letter point (session + persisted)
      setScore((prev) => ({ ...prev, letterPoints: prev.letterPoints + 1 }));
      addLetterPoint();
    },
    onWordComplete: () => {
      // Award word point (session + persisted)
      setScore((prev) => ({ ...prev, wordPoints: prev.wordPoints + 1 }));
      addWordPoint();
      incrementWordsCompleted();
      // Show celebration
      setShowCelebration(true);
      // Speak celebration
      if (currentWordRef.current) {
        speakCelebration(currentWordRef.current.word);
      }
    },
  });

  // Reset coverage when word changes + auto-speak
  useEffect(() => {
    if (currentWord) {
      resetForNewWord(currentWord.word.length);
      setTraceKey((k) => k + 1); // Force TraceArea remount to clear strokes
      // Auto-speak the word on load (slight delay for better UX)
      const timer = setTimeout(() => {
        speakWord(currentWord.word);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentWord, resetForNewWord, speakWord]);

  // Handle segment hit from tracing
  const handleSegmentHit = useCallback(
    (segmentIndex: number) => {
      markSegmentCovered(segmentIndex);
    },
    [markSegmentCovered]
  );

  // Handle drawing outside corridor (on future letter)
  const handleDrawOutsideCorridor = useCallback(() => {
    // Throttle to prevent speech spam (at least 2 seconds between calls)
    const now = Date.now();
    if (now - lastLockedSpeechRef.current < 2000) return;
    lastLockedSpeechRef.current = now;

    if (currentWordRef.current && currentLetterIndex < currentWordRef.current.word.length) {
      const currentLetter = currentWordRef.current.word[currentLetterIndex];
      speakLockedLetter(currentLetter);
    }
  }, [currentLetterIndex, speakLockedLetter]);

  // Undo: erase the ink on the letter being traced and forget its progress.
  // Letters that are already finished keep their ink and stay solid.
  const traceAreaRef = useRef<TraceAreaHandle>(null);
  const [canUndo, setCanUndo] = useState(false);
  const handleUndo = useCallback(() => {
    traceAreaRef.current?.undoCurrentLetter();
    resetCurrentLetter();
  }, [resetCurrentLetter]);

  // Start over: erase all ink and go back to the first letter.
  // Remounting TraceArea (new key) is what clears its ink.
  const handleStartOver = useCallback(() => {
    resetTracking();
    setTraceKey((k) => k + 1);
  }, [resetTracking]);

  const handleStrokeEnd = useCallback(() => {
    finalizePendingAdvance();
  }, [finalizePendingAdvance]);

  // Handle "Say it" button
  const handleSayIt = useCallback(() => {
    if (currentWord) {
      speakWord(currentWord.word);
    }
  }, [currentWord, speakWord]);

  // Handle "Check" button
  const handleCheck = useCallback(() => {
    if (!currentWord) return;

    if (isWordComplete) {
      // Word is complete - celebrate!
      speakCelebration(currentWord.word);
    } else {
      // Word is incomplete - show red flash and give feedback
      setShowRedFlash(true);
      const nextLetter = currentWord.word[currentLetterIndex];
      speakIncomplete(nextLetter);
      // Clear red flash after 300ms
      setTimeout(() => setShowRedFlash(false), 300);
    }
  }, [currentWord, isWordComplete, currentLetterIndex, speakCelebration, speakIncomplete]);

  if (!currentWord) {
    return (
      <div className="flex-1 flex items-center justify-center text-3xl font-extrabold text-ink-soft">
        Getting your word ready...
      </div>
    );
  }

  // Current coverage percentage for display
  const currentCoverage = currentLetterIndex < currentWord.word.length
    ? Math.round(coveragePercentages[currentLetterIndex] * 100)
    : 100;

  return (
    <div className="flex-1 min-h-0 flex flex-col no-select overflow-hidden">
      {/* Celebration overlay */}
      {showCelebration && (
        <EmojiExplosion
          emoji={currentWord.emoji}
          duration={3000}
          onComplete={() => {
            setShowCelebration(false);
            nextWord();
          }}
        />
      )}

      {/* Red flash overlay for incomplete check */}
      {showRedFlash && (
        <div className="absolute inset-0 bg-red-500/30 z-40 pointer-events-none animate-pulse" />
      )}

      {/* Header: Back | category | stars | Settings. Settings lives here (not
          absolutely positioned) so it can never overlap the score. */}
      <header className="shrink-0 px-4 pt-2 pb-1 flex items-center justify-between gap-3">
        <button onClick={onBack} className="btn btn-quiet btn-stack" aria-label="Back to the game list">
          <span className="btn-icon" aria-hidden>⬅️</span>
          <span>Back</span>
        </button>

        <div className="chip" aria-label={`Category: ${category.displayName}`}>
          <span className="text-2xl" aria-hidden>{category.emoji}</span>
          <span>{category.displayName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stars = letters finished, trophy = words finished this session */}
          <div className="chip" role="img" aria-label={`${score.letterPoints} letter stars`}>
            <span aria-hidden>⭐</span>
            <span aria-hidden>{score.letterPoints}</span>
          </div>
          <div className="chip" role="img" aria-label={`${score.wordPoints} word trophies`}>
            <span aria-hidden>🏆</span>
            <span aria-hidden>{score.wordPoints}</span>
          </div>
          {settingsSlot}
        </div>
      </header>

      {/* Word row: picture + word + "Say it" */}
      <section className="shrink-0 px-4 flex flex-col items-center">
        <div className="flex items-center gap-4">
          {currentWord.emoji && (
            <span className="leading-none" style={{ fontSize: 'clamp(2.75rem, 8vh, 4.5rem)' }} aria-hidden>
              {currentWord.emoji}
            </span>
          )}
          <span
            className="font-extrabold tracking-[0.12em] text-ink leading-none"
            style={{ fontSize: 'clamp(2.5rem, 8vh, 4.25rem)' }}
          >
            {currentWord.word}
          </span>
          <button onClick={handleSayIt} className="btn btn-say btn-stack" aria-label="Say the word">
            <span className="btn-icon" aria-hidden>🔊</span>
            <span>Say it</span>
          </button>
        </div>

        {/* Progress: one pill per letter. Done = green, current = fills as you
            trace, upcoming = empty. Replaces the old "Tracing: X 45%" text. */}
        <div
          className="mt-1 flex items-center justify-center gap-2 h-7"
          role="img"
          aria-label={
            isWordComplete
              ? 'Great job! Word finished'
              : `Letter ${currentLetterIndex + 1} of ${currentWord.word.length}, ${currentCoverage} percent traced`
          }
        >
          {isWordComplete ? (
            <div className="text-xl font-extrabold text-btn-check animate-pulse">
              <span aria-hidden>🎉</span> Great job!
            </div>
          ) : (
            currentWord.word.split('').map((letter, i) => {
              const done = completedLetters[i];
              const active = i === currentLetterIndex;
              const fill = done ? 100 : active ? currentCoverage : 0;
              return (
                <div
                  key={i}
                  className={`relative w-14 h-6 rounded-full overflow-hidden bg-white border-2 ${
                    active ? 'border-ink' : 'border-line'
                  }`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-[#3fbf72] transition-[width] duration-100"
                    style={{ width: `${fill}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-ink" aria-hidden>
                    {done ? '✓' : letter}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Trace area: the only flexible block. min-h-0 lets it shrink below its content height. */}
      <div className="flex-1 min-h-0 px-4 py-2">
        <TraceArea
          key={traceKey}
          word={currentWord.word}
          currentLetterIndex={currentLetterIndex}
          completedLetters={completedLetters}
          corridorWidth={settings.corridorWidth}
          showCorridor={settings.showCorridor}
          onSegmentHit={handleSegmentHit}
          onDrawOutsideCorridor={handleDrawOutsideCorridor}
          ref={traceAreaRef}
          onInkChange={setCanUndo}
          onStrokeEnd={handleStrokeEnd}
        />
      </div>

      {/* Action bar: every button pairs an icon with a short label so
          non-readers can tell them apart. Padding at the bottom leaves room for
          the lip shadow of the chunky buttons. */}
      <div className="shrink-0 px-4 pt-1 pb-3 flex justify-center gap-4">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label="Undo: erase this letter and try it again"
          className="btn btn-undo btn-stack min-w-28"
        >
          <span className="btn-icon" aria-hidden>↩️</span>
          <span>Undo</span>
        </button>
        <button
          onClick={handleStartOver}
          aria-label="Start over: erase everything and begin the word again"
          className="btn btn-start btn-stack min-w-28"
        >
          <span className="btn-icon" aria-hidden>🔄</span>
          <span>Start Over</span>
        </button>
        <button
          onClick={handleCheck}
          aria-label="Check my word"
          className="btn btn-check btn-stack min-w-28"
        >
          <span className="btn-icon" aria-hidden>✅</span>
          <span>Check</span>
        </button>
      </div>
    </div>
  );
}
