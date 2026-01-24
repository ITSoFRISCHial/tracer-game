'use client';

import { useState, useCallback, useMemo } from 'react';
import { WordItem } from '@/types';

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface UseWordQueueOptions {
  words: WordItem[];
  maxLetters?: number; // Filter words longer than this
}

/**
 * Hook for managing a queue of words to trace.
 * Shuffles words without repeating until all are done, then reshuffles.
 */
export function useWordQueue({ words, maxLetters = 6 }: UseWordQueueOptions) {
  // Filter words by max length
  const filteredWords = useMemo(() => {
    return words.filter((w) => w.word.length <= maxLetters);
  }, [words, maxLetters]);

  // Track the shuffled queue and current index
  const [queue, setQueue] = useState<WordItem[]>(() => shuffleArray(filteredWords));
  const [currentIndex, setCurrentIndex] = useState(0);

  // Current word
  const currentWord = queue[currentIndex] || null;

  // Move to next word
  const nextWord = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      // Reshuffle and start over
      setQueue(shuffleArray(filteredWords));
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, queue.length, filteredWords]);

  // Reset to a new shuffled queue
  const resetQueue = useCallback(() => {
    setQueue(shuffleArray(filteredWords));
    setCurrentIndex(0);
  }, [filteredWords]);

  // Stats
  const wordsCompleted = currentIndex;
  const totalWords = queue.length;

  return {
    currentWord,
    nextWord,
    resetQueue,
    wordsCompleted,
    totalWords,
  };
}
