import { Category, CategoryId } from '@/types';

// Minimal word data for iteration 1 - will expand from wordlists.yaml later
export const categories: Record<CategoryId, Category> = {
  animals: {
    id: 'animals',
    displayName: 'Animals',
    emoji: '🐾',
    items: [
      { word: 'DOG', emoji: '🐶' },
      { word: 'CAT', emoji: '🐱' },
      { word: 'FISH', emoji: '🐟' },
    ],
  },
  foods: {
    id: 'foods',
    displayName: 'Foods',
    emoji: '🍕',
    items: [
      { word: 'PIZZA', emoji: '🍕' },
      { word: 'TACO', emoji: '🌮' },
      { word: 'APPLE', emoji: '🍎' },
    ],
  },
  colors: {
    id: 'colors',
    displayName: 'Colors',
    emoji: '🌈',
    items: [
      { word: 'RED', emoji: '🔴' },
      { word: 'BLUE', emoji: '🔵' },
      { word: 'GREEN', emoji: '🟢' },
    ],
  },
  sight_words: {
    id: 'sight_words',
    displayName: 'Sight Words',
    emoji: '📖',
    items: [
      { word: 'THE' },
      { word: 'AND' },
      { word: 'YOU' },
    ],
  },
};

export const categoryList: CategoryId[] = ['animals', 'foods', 'colors', 'sight_words'];
