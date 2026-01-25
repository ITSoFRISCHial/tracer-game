'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

const NUM_SEGMENTS = 120;
const COMPLETION_THRESHOLD = 0.95; // 95% coverage to complete

interface UseCoverageTrackingOptions {
  wordLength: number;
  onLetterComplete?: (letterIndex: number) => void;
  onWordComplete?: () => void;
}

/**
 * Dev Notes: Coverage Tracking Algorithm
 *
 * Each letter's path is discretized into NUM_SEGMENTS points.
 * As the user traces, we mark segments as "covered" when they draw near them.
 * When coverage reaches COMPLETION_THRESHOLD (95%), the letter is complete.
 *
 * This is "easy mode" - very forgiving for young children.
 */
export function useCoverageTracking({
  wordLength,
  onLetterComplete,
  onWordComplete,
}: UseCoverageTrackingOptions) {
  // Track covered segments for each letter
  // Each letter has a Set of covered segment indices (0 to NUM_SEGMENTS-1)
  const [coveredSegments, setCoveredSegments] = useState<Set<number>[]>(() =>
    Array.from({ length: wordLength }, () => new Set<number>())
  );

  // Track which letters are complete
  const [completedLetters, setCompletedLetters] = useState<boolean[]>(() =>
    Array(wordLength).fill(false)
  );

  // Current active letter index
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const lastSegmentRef = useRef<number>(-1);
  const pendingAdvanceRef = useRef(false);
  const pendingLetterIndexRef = useRef<number | null>(null);

  useEffect(() => {
    lastSegmentRef.current = -1;
  }, [currentLetterIndex]);

  // Calculate coverage percentage for each letter
  const coveragePercentages = useMemo(() => {
    return coveredSegments.map((segments) => segments.size / NUM_SEGMENTS);
  }, [coveredSegments]);

  // Mark a segment as covered for the current letter
  const markSegmentCovered = useCallback(
    (segmentIndex: number) => {
      if (currentLetterIndex >= wordLength) return;
      if (completedLetters[currentLetterIndex]) return;
      if (segmentIndex < 0) return;

      setCoveredSegments((prev) => {
        const newSegments = [...prev];
        const letterSegments = new Set(newSegments[currentLetterIndex]);

        const lastSegment = lastSegmentRef.current;
        if (lastSegment >= 0 && lastSegment !== segmentIndex) {
          const start = Math.min(lastSegment, segmentIndex);
          const end = Math.max(lastSegment, segmentIndex);
          if (end - start <= NUM_SEGMENTS / 3) {
            for (let i = start; i <= end; i++) {
              letterSegments.add(i);
            }
          }
        }
        letterSegments.add(segmentIndex);
        lastSegmentRef.current = segmentIndex;
        newSegments[currentLetterIndex] = letterSegments;

        // Check if letter is now complete
        const coverage = letterSegments.size / NUM_SEGMENTS;
        if (coverage >= COMPLETION_THRESHOLD) {
          // Defer completion + advancement until stroke end
          if (!pendingAdvanceRef.current) {
            pendingAdvanceRef.current = true;
            pendingLetterIndexRef.current = currentLetterIndex;
          }
        }

        return newSegments;
      });
    },
    [currentLetterIndex, wordLength, completedLetters, onLetterComplete, onWordComplete]
  );

  const finalizePendingAdvance = useCallback(() => {
    if (!pendingAdvanceRef.current) return;

    pendingAdvanceRef.current = false;
    const completedIndex = pendingLetterIndexRef.current ?? currentLetterIndex;
    pendingLetterIndexRef.current = null;

    setCompletedLetters((prevCompleted) => {
      const newCompleted = [...prevCompleted];
      if (completedIndex >= 0 && completedIndex < newCompleted.length) {
        newCompleted[completedIndex] = true;
      }
      return newCompleted;
    });

    onLetterComplete?.(completedIndex);

    const nextIndex = completedIndex + 1;
    if (nextIndex >= wordLength) {
      // Word is complete!
      onWordComplete?.();
    } else {
      setCurrentLetterIndex(nextIndex);
    }
  }, [currentLetterIndex, wordLength, onWordComplete]);

  // Reset everything for a new word
  const resetTracking = useCallback(() => {
    setCoveredSegments(Array.from({ length: wordLength }, () => new Set<number>()));
    setCompletedLetters(Array(wordLength).fill(false));
    setCurrentLetterIndex(0);
    lastSegmentRef.current = -1;
    pendingAdvanceRef.current = false;
    pendingLetterIndexRef.current = null;
  }, [wordLength]);

  // Reset tracking for word length changes
  const resetForNewWord = useCallback(
    (newWordLength: number) => {
      setCoveredSegments(Array.from({ length: newWordLength }, () => new Set<number>()));
      setCompletedLetters(Array(newWordLength).fill(false));
      setCurrentLetterIndex(0);
      lastSegmentRef.current = -1;
      pendingAdvanceRef.current = false;
      pendingLetterIndexRef.current = null;
    },
    []
  );

  // Check if entire word is complete
  const isWordComplete = useMemo(() => {
    return completedLetters.every((complete) => complete);
  }, [completedLetters]);

  return {
    currentLetterIndex,
    completedLetters,
    coveragePercentages,
    markSegmentCovered,
    finalizePendingAdvance,
    resetTracking,
    resetForNewWord,
    isWordComplete,
    completionThreshold: COMPLETION_THRESHOLD,
  };
}
