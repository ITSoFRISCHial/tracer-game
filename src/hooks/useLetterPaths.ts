'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getGlyph } from '@/lib/glyphs';
import {
  PathPoint,
  discretizePath,
  isPointInCorridor,
  getCorridorRadius,
} from '@/utils/pathUtils';
import { Point } from './useDrawing';

const NUM_SEGMENTS = 120;
const LETTER_SPACING = 15;
const PADDING = 20;

export interface LetterPathData {
  letter: string;
  index: number;
  x: number; // X offset in the word
  width: number;
  pathData: string; // Original SVG path d
  points: PathPoint[]; // Discretized points
}

interface UseLetterPathsOptions {
  word: string;
  corridorWidth?: number; // Width in viewBox units
}

/**
 * Hook that manages discretized path data for all letters in a word.
 * Provides hit-testing for the active letter.
 */
export function useLetterPaths({
  word,
  corridorWidth = 42,
}: UseLetterPathsOptions) {
  const [letterPaths, setLetterPaths] = useState<LetterPathData[]>([]);
  const [isReady, setIsReady] = useState(false);

  const corridorRadius = corridorWidth / 2;

  // Calculate letter positions and load path data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPaths = () => {
      const paths: LetterPathData[] = [];
      let currentX = PADDING;

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const glyph = getGlyph(char);

        if (glyph) {
          // Discretize the path with the X offset applied
          const offsetPath = applyOffsetToPath(glyph.path, currentX, PADDING);
          const points = discretizePath(offsetPath, NUM_SEGMENTS);

          paths.push({
            letter: char,
            index: i,
            x: currentX,
            width: glyph.width,
            pathData: glyph.path,
            points,
          });

          currentX += glyph.width + LETTER_SPACING;
        }
      }

      setLetterPaths(paths);
      setIsReady(true);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadPaths, 0);
    return () => clearTimeout(timer);
  }, [word]);

  /**
   * Check if a point is inside the corridor of a specific letter.
   */
  const checkPointInLetter = useCallback(
    (
      point: Point,
      letterIndex: number
    ): { inCorridor: boolean; segmentIndex: number } => {
      if (letterIndex < 0 || letterIndex >= letterPaths.length) {
        return { inCorridor: false, segmentIndex: -1 };
      }

      const letterPath = letterPaths[letterIndex];
      const result = isPointInCorridor(
        point,
        letterPath.points,
        corridorRadius
      );

      return {
        inCorridor: result.inCorridor,
        segmentIndex: result.nearestIndex,
      };
    },
    [letterPaths, corridorRadius]
  );

  /**
   * Get the path data for a specific letter (for rendering corridor clip path).
   */
  const getLetterPath = useCallback(
    (letterIndex: number): LetterPathData | null => {
      return letterPaths[letterIndex] || null;
    },
    [letterPaths]
  );

  return {
    letterPaths,
    isReady,
    checkPointInLetter,
    getLetterPath,
    corridorRadius,
  };
}

/**
 * Apply X and Y offset to an SVG path by transforming coordinates.
 * This is a simple approach that works for M, L, Q commands.
 */
function applyOffsetToPath(pathData: string, offsetX: number, offsetY: number): string {
  // Split path into commands
  const commands = pathData.match(/[MLQCAZ][^MLQCAZ]*/gi) || [];

  return commands
    .map((cmd) => {
      const type = cmd[0].toUpperCase();
      const coords = cmd
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(Number);

      if (type === 'M' || type === 'L') {
        // Move/Line: x y
        return `${type} ${coords[0] + offsetX} ${coords[1] + offsetY}`;
      } else if (type === 'Q') {
        // Quadratic curve: cpx cpy x y
        return `${type} ${coords[0] + offsetX} ${coords[1] + offsetY} ${coords[2] + offsetX} ${coords[3] + offsetY}`;
      } else if (type === 'C') {
        // Cubic curve: cp1x cp1y cp2x cp2y x y
        return `${type} ${coords[0] + offsetX} ${coords[1] + offsetY} ${coords[2] + offsetX} ${coords[3] + offsetY} ${coords[4] + offsetX} ${coords[5] + offsetY}`;
      }
      return cmd;
    })
    .join(' ');
}
