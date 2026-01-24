'use client';

import { useCallback, useRef } from 'react';

/**
 * Dev Notes: Speech Synthesis Hook
 *
 * Uses the Web Speech API (speechSynthesis) for voice feedback.
 * - Auto-detects best available voice (prefers English voices)
 * - Queues speech to avoid overlapping
 * - Provides speak() function for arbitrary text
 */

// Funny encouragement lines for kids
const FUNNY_LINES = [
  "Pretend you're a robot pencil!",
  "That letter is hiding—go find it!",
  "Zoom! Super tracer power!",
  "You're doing awesome!",
  "Keep going, superstar!",
  "Almost there, you can do it!",
  "Trace it like a race car!",
  "You're a tracing champion!",
  "Show that letter who's boss!",
  "Wiggle your finger and try again!",
  "You've got magic tracing powers!",
  "That letter wants to be your friend!",
  "Super duper tracing time!",
  "Be a tracing superhero!",
  "Your finger is a magic wand!",
];

export function useSpeech(enabled: boolean = true) {
  const isSpeakingRef = useRef(false);
  const queueRef = useRef<string[]>([]);

  // Get a random funny line
  const getRandomFunnyLine = useCallback(() => {
    return FUNNY_LINES[Math.floor(Math.random() * FUNNY_LINES.length)];
  }, []);

  // Speak text using Web Speech API
  const speak = useCallback(
    (text: string, options?: { rate?: number; pitch?: number }) => {
      if (!enabled) return;
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 0.9; // Slightly slower for kids
      utterance.pitch = options?.pitch ?? 1.1; // Slightly higher pitch
      utterance.volume = 1;

      // Try to find a good English voice
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(
        (v) => v.lang.startsWith('en') && v.name.includes('Samantha')
      ) || voices.find(
        (v) => v.lang.startsWith('en-US')
      ) || voices.find(
        (v) => v.lang.startsWith('en')
      );

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      // Cancel any ongoing speech and speak
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    },
    [enabled]
  );

  // Speak the word (for "Say it" button)
  const speakWord = useCallback(
    (word: string) => {
      speak(word, { rate: 0.8 }); // Even slower for word pronunciation
    },
    [speak]
  );

  // Voice coach: when drawing on locked letter
  const speakLockedLetter = useCallback(
    (currentLetter: string) => {
      speak(`Let's do ${currentLetter} first!`);
    },
    [speak]
  );

  // Voice coach: when Check button pressed and word incomplete
  const speakIncomplete = useCallback(
    (nextLetter: string) => {
      const funnyLine = getRandomFunnyLine();
      speak(`You still need the letter ${nextLetter}. You've got this! ${funnyLine}`);
    },
    [speak, getRandomFunnyLine]
  );

  // Voice coach: when Check button pressed and word complete
  const speakComplete = useCallback(
    (word: string) => {
      speak(`Awesome! You traced ${word}!`);
    },
    [speak]
  );

  // Voice coach: celebration on word completion
  const speakCelebration = useCallback(
    (word: string, emoji?: string) => {
      const exclamations = ['Great job!', 'Amazing!', 'Wonderful!', 'Fantastic!', 'Super!'];
      const exclamation = exclamations[Math.floor(Math.random() * exclamations.length)];
      speak(`${exclamation} You traced ${word}!`);
    },
    [speak]
  );

  return {
    speak,
    speakWord,
    speakLockedLetter,
    speakIncomplete,
    speakComplete,
    speakCelebration,
  };
}
