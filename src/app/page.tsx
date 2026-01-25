'use client';

import { useState } from 'react';
import { CategoryId, GameScreen } from '@/types';
import CategoryPicker from '@/components/CategoryPicker';
import GameScreenComponent from '@/components/GameScreen';
import { SettingsProvider } from '@/hooks/useSettings';
import SettingsDrawer, { SettingsButton } from '@/components/SettingsDrawer';

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('category-select');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCategorySelect = (categoryId: CategoryId) => {
    setSelectedCategory(categoryId);
    setScreen('tracing');
  };

  const handleBackToCategories = () => {
    setScreen('category-select');
    setSelectedCategory(null);
  };

  return (
    <SettingsProvider>
      <main className="min-h-screen min-h-dvh flex flex-col relative safe-area-inset">
        {/* Settings button - always visible, positioned for notched devices */}
        <div className="absolute z-40" style={{ top: 'max(1rem, env(safe-area-inset-top))', right: 'max(1rem, env(safe-area-inset-right))' }}>
          <SettingsButton onOpen={() => setSettingsOpen(true)} />
        </div>

        {screen === 'category-select' && (
          <CategoryPicker onSelect={handleCategorySelect} />
        )}
        {screen === 'tracing' && selectedCategory && (
          <GameScreenComponent
            categoryId={selectedCategory}
            onBack={handleBackToCategories}
          />
        )}

        {/* Settings drawer */}
        <SettingsDrawer
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </main>
    </SettingsProvider>
  );
}
