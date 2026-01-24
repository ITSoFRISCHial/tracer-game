'use client';

import { useState } from 'react';
import { CategoryId, GameScreen } from '@/types';
import CategoryPicker from '@/components/CategoryPicker';
import GameScreenComponent from '@/components/GameScreen';

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('category-select');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);

  const handleCategorySelect = (categoryId: CategoryId) => {
    setSelectedCategory(categoryId);
    setScreen('tracing');
  };

  const handleBackToCategories = () => {
    setScreen('category-select');
    setSelectedCategory(null);
  };

  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      {screen === 'category-select' && (
        <CategoryPicker onSelect={handleCategorySelect} />
      )}
      {screen === 'tracing' && selectedCategory && (
        <GameScreenComponent
          categoryId={selectedCategory}
          onBack={handleBackToCategories}
        />
      )}
    </main>
  );
}
