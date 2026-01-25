'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface GameSettings {
  corridorWidth: number;       // 30-60, default 42
  completionThreshold: number; // 0.5-1.0, default 0.95
  speechEnabled: boolean;      // default true
}

export interface PersistedScores {
  letterPoints: number;
  wordPoints: number;
  wordsCompleted: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  corridorWidth: 42,
  completionThreshold: 0.95,
  speechEnabled: true,
};

const DEFAULT_SCORES: PersistedScores = {
  letterPoints: 0,
  wordPoints: 0,
  wordsCompleted: 0,
};

const SETTINGS_KEY = 'tracer-game-settings';
const SCORES_KEY = 'tracer-game-scores';

interface SettingsContextValue {
  settings: GameSettings;
  updateSettings: (updates: Partial<GameSettings>) => void;
  resetSettings: () => void;
  scores: PersistedScores;
  addLetterPoint: () => void;
  addWordPoint: () => void;
  incrementWordsCompleted: () => void;
  resetScores: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }): ReactNode {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [scores, setScores] = useState<PersistedScores>(DEFAULT_SCORES);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load settings and scores from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }

      const savedScores = localStorage.getItem(SCORES_KEY);
      if (savedScores) {
        const parsed = JSON.parse(savedScores);
        setScores({ ...DEFAULT_SCORES, ...parsed });
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
    setIsHydrated(true);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }, [settings, isHydrated]);

  // Save scores to localStorage when they change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    } catch (e) {
      console.warn('Failed to save scores to localStorage:', e);
    }
  }, [scores, isHydrated]);

  const updateSettings = useCallback((updates: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const addLetterPoint = useCallback(() => {
    setScores((prev) => ({ ...prev, letterPoints: prev.letterPoints + 1 }));
  }, []);

  const addWordPoint = useCallback(() => {
    setScores((prev) => ({ ...prev, wordPoints: prev.wordPoints + 1 }));
  }, []);

  const incrementWordsCompleted = useCallback(() => {
    setScores((prev) => ({ ...prev, wordsCompleted: prev.wordsCompleted + 1 }));
  }, []);

  const resetScores = useCallback(() => {
    setScores(DEFAULT_SCORES);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        scores,
        addLetterPoint,
        addWordPoint,
        incrementWordsCompleted,
        resetScores,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
