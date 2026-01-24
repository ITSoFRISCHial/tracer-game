// Category types
export type CategoryId = 'animals' | 'foods' | 'colors' | 'sight_words';

export interface WordItem {
  word: string;
  emoji?: string;
}

export interface Category {
  id: CategoryId;
  displayName: string;
  emoji: string;
  items: WordItem[];
}

// Game screens
export type GameScreen = 'category-select' | 'tracing';

// Scoring
export interface Score {
  letterPoints: number;
  wordPoints: number;
}
