'use client';

import { getGlyph, GLYPH_HEIGHT } from '@/lib/glyphs';

interface LetterGlyphProps {
  letter: string;
  x: number;           // X position in the parent SVG
  isActive: boolean;   // Is this the letter currently being traced?
  isComplete: boolean; // Has this letter been completed?
  scale?: number;      // Scale factor for the glyph
}

/**
 * Renders a single letter glyph as an SVG group.
 * - Dotted outline when incomplete
 * - Solid black when complete
 * - Slightly highlighted when active
 */
export default function LetterGlyph({
  letter,
  x,
  isActive,
  isComplete,
  scale = 1,
}: LetterGlyphProps) {
  const glyph = getGlyph(letter);

  if (!glyph) {
    return null;
  }

  // Determine stroke style based on state
  const strokeColor = isComplete ? '#000000' : '#666666';
  const strokeWidth = isComplete ? 6 : 4;
  const strokeDasharray = isComplete ? 'none' : '8 6';
  const opacity = isActive || isComplete ? 1 : 0.5;

  return (
    <g
      transform={`translate(${x}, 0) scale(${scale})`}
      opacity={opacity}
    >
      {/* The letter path */}
      <path
        d={glyph.path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Active indicator - subtle glow */}
      {isActive && !isComplete && (
        <path
          d={glyph.path}
          fill="none"
          stroke="#4CAF50"
          strokeWidth={strokeWidth + 8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.2}
        />
      )}
    </g>
  );
}

/**
 * Get the scaled width of a letter
 */
export function getLetterWidth(letter: string, scale: number = 1): number {
  const glyph = getGlyph(letter);
  return glyph ? glyph.width * scale : 0;
}

export { GLYPH_HEIGHT };
