'use client';

import { useMemo, useCallback } from 'react';
import LetterGlyph, { GLYPH_HEIGHT } from './LetterGlyph';
import { getGlyph } from '@/lib/glyphs';
import { useDrawing, strokeToPath, Stroke, Point, PointFilterResult } from '@/hooks/useDrawing';
import { useLetterPaths } from '@/hooks/useLetterPaths';

interface TraceAreaProps {
  word: string;
  currentLetterIndex: number;  // Which letter is active (0-indexed)
  completedLetters: boolean[]; // Array of completion status for each letter
  onClear?: () => void;        // Called when clear button is pressed
  onSegmentHit?: (segmentIndex: number) => void; // Called when a segment is hit
  onDrawOutsideCorridor?: () => void; // Called when drawing outside corridor
}

const LETTER_SPACING = 15; // Space between letters
const PADDING = 20;        // Padding around the word
const CORRIDOR_WIDTH = 42; // Width of the hit-testing corridor

/**
 * Dev Notes: Trace Area with Corridor Hit-Testing
 *
 * This component renders the word and handles drawing with corridor constraints:
 * - Ink only appears when drawing inside the active letter's corridor
 * - The corridor is defined by a radius around the letter's path
 * - onSegmentHit callback is called for each segment touched (for coverage tracking)
 * - onDrawOutsideCorridor is called when user draws outside (for voice feedback)
 */
export default function TraceArea({
  word,
  currentLetterIndex,
  completedLetters,
  onClear,
  onSegmentHit,
  onDrawOutsideCorridor,
}: TraceAreaProps) {
  // Get letter path data for hit-testing
  const { letterPaths, isReady, checkPointInLetter, corridorRadius } =
    useLetterPaths({ word, corridorWidth: CORRIDOR_WIDTH });

  // Point filter for corridor hit-testing
  // Defined inline (no useCallback) to ensure we always have fresh values
  const pointFilter = (point: Point): PointFilterResult => {
    if (!isReady || !letterPaths || letterPaths.length === 0) {
      return { accepted: false };
    }

    // Check if point is in the active letter's corridor (for coverage tracking)
    if (currentLetterIndex < word.length && currentLetterIndex < letterPaths.length) {
      const result = checkPointInLetter(point, currentLetterIndex);
      if (result.inCorridor) {
        return {
          accepted: true,
          segmentIndex: result.segmentIndex,
        };
      }
    }

    // Allow drawing on already-completed letters (no coverage tracking needed)
    for (let i = 0; i < currentLetterIndex && i < letterPaths.length; i++) {
      if (completedLetters[i]) {
        const completedResult = checkPointInLetter(point, i);
        if (completedResult.inCorridor) {
          // Accept the point but don't report segment (already complete)
          return { accepted: true, segmentIndex: -1 };
        }
      }
    }

    // Check if they're trying to draw on a future (locked) letter
    for (let i = currentLetterIndex + 1; i < word.length && i < letterPaths.length; i++) {
      const futureResult = checkPointInLetter(point, i);
      if (futureResult.inCorridor) {
        // Drawing on a locked future letter
        onDrawOutsideCorridor?.();
        return { accepted: false };
      }
    }

    // Point is not in any letter corridor - reject
    return { accepted: false };
  };

  // Callback when point is accepted (only report valid segments for coverage tracking)
  const handlePointAccepted = useCallback(
    (_point: Point, segmentIndex: number) => {
      // Only report segment hits for the active letter (segmentIndex >= 0)
      // Completed letters return -1 and don't need coverage tracking
      if (segmentIndex >= 0) {
        onSegmentHit?.(segmentIndex);
      }
    },
    [onSegmentHit]
  );

  // Drawing state and handlers with hit-testing
  const { strokes, currentStroke, handlers, clearStrokes } = useDrawing({
    throttleMs: 12,
    pointFilter,
    onPointAccepted: handlePointAccepted,
  });

  // Calculate layout for all letters
  const layout = useMemo(() => {
    const letters: { letter: string; x: number; width: number }[] = [];
    let currentX = PADDING;

    for (const char of word) {
      const glyph = getGlyph(char);
      if (glyph) {
        letters.push({
          letter: char,
          x: currentX,
          width: glyph.width,
        });
        currentX += glyph.width + LETTER_SPACING;
      }
    }

    const totalWidth = currentX - LETTER_SPACING + PADDING;
    return { letters, totalWidth };
  }, [word]);

  // Calculate viewBox to fit all letters
  const viewBoxWidth = layout.totalWidth;
  const viewBoxHeight = GLYPH_HEIGHT + PADDING * 2;

  // Combine completed strokes with current stroke for rendering
  const allStrokes: Stroke[] = currentStroke
    ? [...strokes, currentStroke]
    : strokes;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-white rounded-2xl shadow-inner overflow-hidden">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full max-h-full touch-none"
          preserveAspectRatio="xMidYMid meet"
          style={{ touchAction: 'none', cursor: 'crosshair', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
          {...handlers}
        >
          {/* Background */}
          <rect
            x="0"
            y="0"
            width={viewBoxWidth}
            height={viewBoxHeight}
            fill="#fafafa"
            rx="10"
          />

          {/* Baseline guide (subtle) */}
          <line
            x1={PADDING}
            y1={PADDING + 120}
            x2={viewBoxWidth - PADDING}
            y2={PADDING + 120}
            stroke="#e0e0e0"
            strokeWidth="2"
            strokeDasharray="5 5"
          />

          {/* Debug: Show corridor for active letter */}
          {isReady && letterPaths[currentLetterIndex] && (
            <g opacity={0.1}>
              {letterPaths[currentLetterIndex].points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={corridorRadius}
                  fill="#4CAF50"
                />
              ))}
            </g>
          )}

          {/* Render all letters */}
          <g transform={`translate(0, ${PADDING})`}>
            {layout.letters.map((item, index) => (
              <LetterGlyph
                key={`${item.letter}-${index}`}
                letter={item.letter}
                x={item.x}
                isActive={index === currentLetterIndex}
                isComplete={completedLetters[index] || false}
              />
            ))}
          </g>

          {/* Render ink strokes */}
          <g>
            {allStrokes.map((stroke, index) => (
              <path
                key={index}
                d={strokeToPath(stroke)}
                fill="none"
                stroke="#2196F3"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Clear button */}
      {strokes.length > 0 && (
        <button
          onClick={() => {
            clearStrokes();
            onClear?.();
          }}
          className="mt-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear Drawing
        </button>
      )}
    </div>
  );
}
