'use client';

import { ReactNode } from 'react';
import { CategoryId } from '@/types';
import { categories, categoryList } from '@/data/categories';

interface CategoryPickerProps {
  onSelect: (categoryId: CategoryId) => void;
  /** The hold-to-open Settings button, rendered in the top-right of the header row. */
  settingsSlot?: ReactNode;
}

/**
 * Dev Notes: Category picker (home screen)
 *
 * A header row (title left, settings right) followed by a 2x2 grid of big
 * emoji + label cards. The grid uses `flex-1 min-h-0` and `grid-rows-2` so the
 * cards stretch to the available height and never push past the viewport on
 * short iPad screens; the emoji size is clamped with vw/vh units.
 * Every card is a real <button> with an emoji icon and a text label.
 */
export default function CategoryPicker({ onSelect, settingsSlot }: CategoryPickerProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 px-5 pt-3 pb-5 sm:px-8">
      <header className="shrink-0 flex items-center justify-between gap-4">
        <div className="w-24" aria-hidden />
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink">
            Trace the Word!
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-ink-soft">
            Pick a game to play
          </p>
        </div>
        <div className="w-24 flex justify-end">{settingsSlot}</div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-4 sm:gap-6 w-full max-w-3xl mx-auto">
        {categoryList.map((categoryId, i) => {
          const category = categories[categoryId];
          // Cycle accent colors so each card is recognisable at a glance.
          const accents = ['#ffd6a5', '#ffc6d0', '#c4e8ff', '#d3f2c4'];
          return (
            <button
              key={categoryId}
              onClick={() => onSelect(categoryId)}
              className="card-btn min-h-[120px] flex flex-col items-center justify-center gap-1 sm:gap-2"
              style={{ backgroundColor: accents[i % accents.length] }}
            >
              <span
                className="leading-none"
                style={{ fontSize: 'clamp(3.5rem, min(12vw, 16vh), 7rem)' }}
                aria-hidden
              >
                {category.emoji}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-ink">
                {category.displayName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
