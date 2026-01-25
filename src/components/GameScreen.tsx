'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { CategoryId, Score } from '@/types';
import { categories } from '@/data/categories';
import TraceArea from './TraceArea';
import { useCoverageTracking } from '@/hooks/useCoverageTracking';
import { useWordQueue } from '@/hooks/useWordQueue';
import { useSpeech } from '@/hooks/useSpeech';

interface GameScreenProps {
  categoryId: CategoryId;
  onBack: () => void;
}

export default function GameScreen({ categoryId, onBack }: GameScreenProps) {
  const category = categories[categoryId];

  // Word queue for random word selection
  const { currentWord, nextWord, wordsCompleted } = useWordQueue({
    words: category.items,
    maxLetters: 6,
  });

  // Score tracking
  const [score, setScore] = useState<Score>({ letterPoints: 0, wordPoints: 0 });

  // Showing celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  // Red flash state for incomplete check
  const [showRedFlash, setShowRedFlash] = useState(false);

  // Key to force TraceArea remount on word change
  const [traceKey, setTraceKey] = useState(0);

  // Speech synthesis
  const { speakWord, speakLockedLetter, speakIncomplete, speakCelebration } = useSpeech(true);

  // Ref to store the current word for callbacks
  const currentWordRef = useRef(currentWord);
  useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);

  // Throttle ref for locked letter speech (prevent spam)
  const lastLockedSpeechRef = useRef(0);

  // Coverage tracking hook
  const {
    currentLetterIndex,
    completedLetters,
    coveragePercentages,
    markSegmentCovered,
    finalizePendingAdvance,
    resetTracking,
    resetForNewWord,
    isWordComplete,
  } = useCoverageTracking({
    wordLength: currentWord?.word.length || 0,
    onLetterComplete: () => {
      // Award letter point
      setScore((prev) => ({ ...prev, letterPoints: prev.letterPoints + 1 }));
    },
    onWordComplete: () => {
      // Award word point
      setScore((prev) => ({ ...prev, wordPoints: prev.wordPoints + 1 }));
      // Show celebration
      setShowCelebration(true);
      // Speak celebration
      if (currentWordRef.current) {
        speakCelebration(currentWordRef.current.word);
      }
      // Move to next word after delay
      setTimeout(() => {
        setShowCelebration(false);
        nextWord();
      }, 900);
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

  // Handle clear - also reset coverage
  const handleClear = useCallback(() => {
    resetTracking();
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
    return <div>Loading...</div>;
  }

  // Current coverage percentage for display
  const currentCoverage = currentLetterIndex < currentWord.word.length
    ? Math.round(coveragePercentages[currentLetterIndex] * 100)
    : 100;

  return (
    <div className="flex-1 flex flex-col no-select">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 z-50 pointer-events-none">
          <div className="text-6xl animate-bounce">
            {currentWord.emoji || '🎉'}
          </div>
        </div>
      )}

      {/* Red flash overlay for incomplete check */}
      {showRedFlash && (
        <div className="absolute inset-0 bg-red-500/30 z-40 pointer-events-none animate-pulse" />
      )}

      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-white/80 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="px-4 py-2 text-lg font-semibold text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
        <div className="text-center">
          <span className="text-2xl">{category.emoji}</span>
          <span className="ml-2 text-lg font-semibold text-gray-700">
            {category.displayName}
          </span>
        </div>
        <div className="w-20 text-right text-sm text-gray-500">
          #{wordsCompleted + 1}
        </div>
      </div>

      {/* Top section: Word display with emoji */}
      <div className="p-6 flex flex-col items-center justify-center bg-white/50">
        <div className="text-5xl md:text-6xl font-bold text-gray-800 tracking-wider flex items-center">
          {currentWord.emoji && (
            <span className="mr-4 text-6xl md:text-7xl">{currentWord.emoji}</span>
          )}
          {currentWord.word}
          <button
            onClick={handleSayIt}
            className="ml-4 text-4xl hover:scale-110 active:scale-95 transition-transform"
            aria-label="Say the word"
          >
            🔊
          </button>
        </div>

        {/* Coverage progress */}
        <div className="mt-4 flex flex-col items-center gap-2">
          {!isWordComplete && (
            <div className="flex items-center gap-3">
              <span className="text-lg text-gray-600">
                Tracing: <strong>{currentWord.word[currentLetterIndex]}</strong>
              </span>
              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${currentCoverage}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">{currentCoverage}%</span>
            </div>
          )}
          {isWordComplete && (
            <div className="text-2xl text-green-600 font-bold animate-pulse">
              Great job!
            </div>
          )}
        </div>

        {/* Score display */}
        <div className="mt-4 flex gap-8 text-lg text-gray-600">
          <span>Letter Points: <strong>{score.letterPoints}</strong></span>
          <span>Word Points: <strong>{score.wordPoints}</strong></span>
        </div>
      </div>

      {/* Bottom section: Trace area */}
      <div className="flex-1 p-4 pb-8">
        <TraceArea
          key={traceKey}
          word={currentWord.word}
          currentLetterIndex={currentLetterIndex}
          completedLetters={completedLetters}
          onSegmentHit={handleSegmentHit}
          onDrawOutsideCorridor={handleDrawOutsideCorridor}
          onClear={handleClear}
          onStrokeEnd={handleStrokeEnd}
        />
      </div>

      {/* Action buttons */}
      <div className="p-4 bg-white/80 flex justify-center gap-4">
        <button
          onClick={handleClear}
          className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold text-lg hover:bg-gray-600 active:scale-95 transition-all"
        >
          Start Over
        </button>
        <button
          onClick={handleCheck}
          className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold text-lg hover:bg-green-600 active:scale-95 transition-all flex items-center gap-2"
        >
          <span>✅</span> Check
        </button>
      </div>
    </div>
  );
}
