'use client';

import { CategoryId } from '@/types';
import { categories, categoryList } from '@/data/categories';

interface CategoryPickerProps {
  onSelect: (categoryId: CategoryId) => void;
}

export default function CategoryPicker({ onSelect }: CategoryPickerProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
      <h1 className="text-4xl font-bold text-gray-800 text-center">
        Trace the Word!
      </h1>
      <p className="text-xl text-gray-600 text-center">
        Pick a category to start tracing
      </p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {categoryList.map((categoryId) => {
          const category = categories[categoryId];
          return (
            <button
              key={categoryId}
              onClick={() => onSelect(categoryId)}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-150 min-h-[140px]"
            >
              <span className="text-5xl mb-2">{category.emoji}</span>
              <span className="text-lg font-semibold text-gray-700">
                {category.displayName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
