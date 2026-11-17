'use client';

import { useMemo, useCallback, useRef, useEffect, useImperativeHandle, Ref } from 'react';
import LetterGlyph, { GLYPH_HEIGHT } from './LetterGlyph';
import { getGlyph } from '@/lib/glyphs';
import { useDrawing, strokeToPath, Stroke, Point, PointFilterResult } from '@/hooks/useDrawing';
import { useLetterPaths } from '@/hooks/useLetterPaths';

interface TraceAreaProps {
  word: string;
  currentLetterIndex: number;  // Which letter is active (0-indexed)
  completedLetters: boolean[]; // Array of completion status for each letter
  corridorWidth?: number;      // Width of the hit-testing corridor (default 42)
  showCorridor?: boolean;      // Draw the faint corridor circles (debug aid; default false)
  ref?: Ref<TraceAreaHandle>;   // Lets the parent trigger undo
  onInkChange?: (hasInkForCurrentLetter: boolean) => void; // Tells the parent whether undo has anything to erase
  onSegmentHit?: (segmentIndex: number) => void; // Called when a segment is hit
  onDrawOutsideCorridor?: () => void; // Called when drawing outside corridor
  onStrokeEnd?: () => void; // Called when a stroke ends
}

/** Imperative actions the parent (GameScreen) can trigger from its buttons. */
export interface TraceAreaHandle {
  /** Erase the ink drawn on the letter currently being traced. Completed letters keep their ink. */
  undoCurrentLetter: () => void;
}

const LETTER_SPACING = 15; // Space between letters
const PADDING = 20;        // Padding around the word
const DEFAULT_CORRIDOR_WIDTH = 42; // Default width of the hit-testing corridor

/**
 * Dev Notes: Trace Area with Corridor Hit-Testing
 *
 * This component renders the word and handles drawing with corridor constraints:
 * - Ink only appears when drawing inside the active letter's corridor
 * - The corridor is defined by a radius around the letter's path
 * - onSegmentHit callback is called for each segment touched (for coverage tracking)
 * - onDrawOutsideCorridor is called when user draws outside (for voice feedback)
 *
 * Layout: the component fills its parent (w-full h-full). The SVG uses a
 * viewBox + preserveAspectRatio="xMidYMid meet", so the word scales to the
 * largest size that fits the box without ever overflowing; the parent decides
 * the box (flex-1 min-h-0 in GameScreen). Pointer coordinates are mapped back
 * through the SVG screen CTM in useDrawing, so scaling does not offset the ink.
 *
 * Undo: `ref.undoCurrentLetter()` removes strokes tagged with the active letter
 * index; `onInkChange` reports whether such ink exists (drives Undo's disabled state).
 */
export default function TraceArea({
  word,
  currentLetterIndex,
  completedLetters,
  corridorWidth = DEFAULT_CORRIDOR_WIDTH,
  showCorridor = false,
  ref,
  onInkChange,
  onSegmentHit,
  onDrawOutsideCorridor,
  onStrokeEnd,
}: TraceAreaProps) {
  const strokeLetterIndexRef = useRef<number | null>(null);

  // Get letter path data for hit-testing
  const { letterPaths, isReady, checkPointInLetter, corridorRadius } =
    useLetterPaths({ word, corridorWidth });

  // Point filter for corridor hit-testing
  // Defined inline (no useCallback) to ensure we always have fresh values
  const pointFilter = (point: Point): PointFilterResult => {
    if (!isReady || !letterPaths || letterPaths.length === 0) {
      return { accepted: false };
    }

    const activeStrokeIndex = strokeLetterIndexRef.current ?? currentLetterIndex;

    // Check if point is in the active stroke letter's corridor
    if (activeStrokeIndex < word.length && activeStrokeIndex < letterPaths.length) {
      const result = checkPointInLetter(point, activeStrokeIndex);
      if (result.inCorridor) {
        return {
          accepted: true,
          segmentIndex: activeStrokeIndex === currentLetterIndex ? result.segmentIndex : -1,
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
  const { strokes, currentStroke, handlers, clearStrokesForLetter } = useDrawing({
    throttleMs: 12,
    pointFilter,
    getStrokeLetterIndex: () => currentLetterIndex,
    onPointAccepted: handlePointAccepted,
    onStrokeStart: () => {
      strokeLetterIndexRef.current = currentLetterIndex;
    },
    onStrokeEnd: () => {
      strokeLetterIndexRef.current = null;
      onStrokeEnd?.();
    },
  });

  // Undo support: expose an imperative handle and report whether there is ink to erase
  useImperativeHandle(
    ref,
    () => ({ undoCurrentLetter: () => clearStrokesForLetter(currentLetterIndex) }),
    [clearStrokesForLetter, currentLetterIndex]
  );

  const hasInkForCurrentLetter =
    strokes.some((stroke) => stroke.letterIndex === currentLetterIndex) ||
    currentStroke !== null;
  useEffect(() => {
    onInkChange?.(hasInkForCurrentLetter);
  }, [hasInkForCurrentLetter, onInkChange]);

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
      <div className="flex-1 flex items-center justify-center bg-[#fffdf8] rounded-[2rem] border-4 border-line shadow-[0_6px_0_var(--color-btn-quiet-lip)] overflow-hidden">
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
            fill="#fffdf8"
            rx="10"
          />

          {/* Baseline guide (subtle) */}
          <line
            x1={PADDING}
            y1={PADDING + 120}
            x2={viewBoxWidth - PADDING}
            y2={PADDING + 120}
            stroke="#d9c79c"
            strokeWidth="2"
            strokeDasharray="5 5"
          />

          {/* Debug: corridor for the active letter. Hidden unless the
              "Show tracing zone" setting is on. */}
          {showCorridor && isReady && letterPaths[currentLetterIndex] && (
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
                stroke="#2b6cdf"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
