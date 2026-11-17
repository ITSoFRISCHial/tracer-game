'use client';

import { useState } from 'react';
import { CategoryId, GameScreen } from '@/types';
import CategoryPicker from '@/components/CategoryPicker';
import GameScreenComponent from '@/components/GameScreen';
import { SettingsProvider } from '@/hooks/useSettings';
import SettingsDrawer, { SettingsButton } from '@/components/SettingsDrawer';

/**
 * Dev Notes: Page shell
 *
 * - `.app-height` (100dvh) + `overflow-hidden` makes <main> exactly as tall as
 *   the VISIBLE iPad Safari viewport; children use flex + min-h-0 so the trace
 *   area absorbs all leftover space and header / action bar never clip.
 * - The Settings button is no longer absolutely positioned. It is created here
 *   (it needs the drawer state) and handed to each screen as `settingsSlot`, so
 *   each screen places it inside its own header row. That removes the old
 *   overlap with the game header.
 */
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

  const settingsSlot = <SettingsButton onOpen={() => setSettingsOpen(true)} />;

  return (
    <SettingsProvider>
      <main className="app-height flex flex-col relative overflow-hidden safe-area-inset">
        {screen === 'category-select' && (
          <CategoryPicker onSelect={handleCategorySelect} settingsSlot={settingsSlot} />
        )}
        {screen === 'tracing' && selectedCategory && (
          <GameScreenComponent
            categoryId={selectedCategory}
            onBack={handleBackToCategories}
            settingsSlot={settingsSlot}
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
