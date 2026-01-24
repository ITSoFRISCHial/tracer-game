/**
 * Dev Notes: Glyph Path Source
 *
 * These are hand-crafted SVG paths for A-Z in a simple "block print" style.
 * Each letter is designed to be traceable with a single continuous stroke
 * where possible, or multiple strokes for letters like T, X, etc.
 *
 * ViewBox: All glyphs use a consistent 100x140 viewBox.
 * - Width: 100 units (letters vary in actual width, stored in `width`)
 * - Height: 140 units (baseline at ~120, cap height at ~20)
 *
 * To extend or modify:
 * 1. Design paths in a vector editor (Figma, Illustrator, Inkscape)
 * 2. Export as SVG, extract the `d` attribute from <path>
 * 3. Ensure coordinates fit within 0-100 width and 20-120 height
 * 4. For multi-stroke letters, separate paths with a space
 *
 * Path style: These use stroke (not fill) for tracing.
 */

export interface GlyphData {
  path: string;      // SVG path d attribute
  width: number;     // Actual width of this letter (for spacing)
  viewBox: string;   // ViewBox for this glyph
}

export const GLYPH_HEIGHT = 140;
export const GLYPH_BASELINE = 120;
export const GLYPH_CAP_HEIGHT = 20;

// Simple block print style glyphs
// Designed for easy tracing by young children
export const glyphs: Record<string, GlyphData> = {
  A: {
    // Two diagonal strokes meeting at top, horizontal bar
    path: 'M 10 120 L 50 20 L 90 120 M 30 80 L 70 80',
    width: 100,
    viewBox: '0 0 100 140',
  },
  B: {
    // Vertical line, two bumps
    path: 'M 15 20 L 15 120 M 15 20 L 60 20 Q 85 20 85 45 Q 85 70 60 70 L 15 70 M 15 70 L 65 70 Q 90 70 90 95 Q 90 120 65 120 L 15 120',
    width: 95,
    viewBox: '0 0 100 140',
  },
  C: {
    // Open curve
    path: 'M 85 35 Q 85 20 65 20 L 35 20 Q 15 20 15 40 L 15 100 Q 15 120 35 120 L 65 120 Q 85 120 85 105',
    width: 90,
    viewBox: '0 0 100 140',
  },
  D: {
    // Vertical line with curve
    path: 'M 15 20 L 15 120 L 50 120 Q 85 120 85 70 Q 85 20 50 20 L 15 20',
    width: 90,
    viewBox: '0 0 100 140',
  },
  E: {
    // Vertical with three horizontals
    path: 'M 80 20 L 15 20 L 15 120 L 80 120 M 15 70 L 65 70',
    width: 85,
    viewBox: '0 0 100 140',
  },
  F: {
    // Vertical with two horizontals
    path: 'M 80 20 L 15 20 L 15 120 M 15 70 L 65 70',
    width: 85,
    viewBox: '0 0 100 140',
  },
  G: {
    // C with horizontal bar
    path: 'M 85 35 Q 85 20 65 20 L 35 20 Q 15 20 15 40 L 15 100 Q 15 120 35 120 L 65 120 Q 85 120 85 100 L 85 70 L 55 70',
    width: 90,
    viewBox: '0 0 100 140',
  },
  H: {
    // Two verticals with horizontal bar
    path: 'M 15 20 L 15 120 M 85 20 L 85 120 M 15 70 L 85 70',
    width: 100,
    viewBox: '0 0 100 140',
  },
  I: {
    // Vertical with serifs
    path: 'M 25 20 L 75 20 M 50 20 L 50 120 M 25 120 L 75 120',
    width: 80,
    viewBox: '0 0 100 140',
  },
  J: {
    // Top serif, vertical, curve at bottom
    path: 'M 25 20 L 75 20 M 50 20 L 50 100 Q 50 120 30 120 L 20 120 Q 10 120 10 110',
    width: 80,
    viewBox: '0 0 100 140',
  },
  K: {
    // Vertical with two diagonals
    path: 'M 15 20 L 15 120 M 80 20 L 15 70 L 80 120',
    width: 85,
    viewBox: '0 0 100 140',
  },
  L: {
    // Simple L shape
    path: 'M 15 20 L 15 120 L 80 120',
    width: 85,
    viewBox: '0 0 100 140',
  },
  M: {
    // Two verticals with V in middle
    path: 'M 10 120 L 10 20 L 50 80 L 90 20 L 90 120',
    width: 100,
    viewBox: '0 0 100 140',
  },
  N: {
    // Two verticals with diagonal
    path: 'M 15 120 L 15 20 L 85 120 L 85 20',
    width: 100,
    viewBox: '0 0 100 140',
  },
  O: {
    // Oval/circle
    path: 'M 50 20 Q 15 20 15 70 Q 15 120 50 120 Q 85 120 85 70 Q 85 20 50 20',
    width: 100,
    viewBox: '0 0 100 140',
  },
  P: {
    // Vertical with bump at top
    path: 'M 15 120 L 15 20 L 60 20 Q 85 20 85 45 Q 85 70 60 70 L 15 70',
    width: 90,
    viewBox: '0 0 100 140',
  },
  Q: {
    // O with tail
    path: 'M 50 20 Q 15 20 15 70 Q 15 120 50 120 Q 85 120 85 70 Q 85 20 50 20 M 60 100 L 90 130',
    width: 100,
    viewBox: '0 0 140 140',
  },
  R: {
    // P with diagonal leg
    path: 'M 15 120 L 15 20 L 60 20 Q 85 20 85 45 Q 85 70 60 70 L 15 70 M 50 70 L 85 120',
    width: 90,
    viewBox: '0 0 100 140',
  },
  S: {
    // Snake shape
    path: 'M 80 35 Q 80 20 55 20 L 45 20 Q 20 20 20 40 Q 20 55 45 60 L 55 65 Q 80 70 80 90 Q 80 120 55 120 L 45 120 Q 20 120 20 105',
    width: 90,
    viewBox: '0 0 100 140',
  },
  T: {
    // Horizontal with vertical
    path: 'M 10 20 L 90 20 M 50 20 L 50 120',
    width: 100,
    viewBox: '0 0 100 140',
  },
  U: {
    // Two verticals with curve at bottom
    path: 'M 15 20 L 15 95 Q 15 120 50 120 Q 85 120 85 95 L 85 20',
    width: 100,
    viewBox: '0 0 100 140',
  },
  V: {
    // Two diagonals meeting at bottom
    path: 'M 10 20 L 50 120 L 90 20',
    width: 100,
    viewBox: '0 0 100 140',
  },
  W: {
    // Four strokes forming W
    path: 'M 5 20 L 25 120 L 50 50 L 75 120 L 95 20',
    width: 100,
    viewBox: '0 0 100 140',
  },
  X: {
    // Two crossing diagonals
    path: 'M 15 20 L 85 120 M 85 20 L 15 120',
    width: 100,
    viewBox: '0 0 100 140',
  },
  Y: {
    // Two diagonals meeting, then vertical down
    path: 'M 10 20 L 50 70 L 90 20 M 50 70 L 50 120',
    width: 100,
    viewBox: '0 0 100 140',
  },
  Z: {
    // Horizontal, diagonal, horizontal
    path: 'M 15 20 L 85 20 L 15 120 L 85 120',
    width: 100,
    viewBox: '0 0 100 140',
  },
};

/**
 * Get glyph data for a letter (case-insensitive)
 */
export function getGlyph(letter: string): GlyphData | null {
  const upper = letter.toUpperCase();
  return glyphs[upper] || null;
}

/**
 * Calculate total width needed to render a word with spacing
 */
export function getWordWidth(word: string, letterSpacing: number = 10): number {
  let totalWidth = 0;
  for (let i = 0; i < word.length; i++) {
    const glyph = getGlyph(word[i]);
    if (glyph) {
      totalWidth += glyph.width;
      if (i < word.length - 1) {
        totalWidth += letterSpacing;
      }
    }
  }
  return totalWidth;
}
