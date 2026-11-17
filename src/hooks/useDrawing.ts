'use client';

import { useState, useCallback, useRef, PointerEvent, TouchEvent } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  /** Which letter was active when the stroke started (used by per-letter undo). */
  letterIndex?: number;
}

// Result from point filter
export interface PointFilterResult {
  accepted: boolean;
  segmentIndex?: number; // If accepted, which segment was hit
}

interface UseDrawingOptions {
  throttleMs?: number; // Minimum ms between point samples
  pointFilter?: (point: Point) => PointFilterResult; // Filter for accepting points
  onPointAccepted?: (point: Point, segmentIndex: number) => void; // Callback when point is accepted
  onPointRejected?: (point: Point) => void; // Callback when point is rejected
  getStrokeLetterIndex?: () => number; // Tags each stroke with the letter being traced
  onStrokeStart?: () => void; // Called when a stroke begins
  onStrokeEnd?: () => void; // Called when a stroke ends
}

/**
 * Hook for handling drawing with pointer events.
 * Returns drawing state and event handlers.
 *
 * Dev Notes:
 * - pointFilter can be used to implement corridor hit-testing
 * - Only accepted points are added to the stroke
 * - Callbacks notify when points are accepted/rejected for coverage tracking
 * - Uses refs to avoid stale closure issues with filter/callbacks
 */
export function useDrawing(options: UseDrawingOptions = {}) {
  const {
    throttleMs = 12,
    pointFilter,
    onPointAccepted,
    onPointRejected,
    getStrokeLetterIndex,
    onStrokeStart,
    onStrokeEnd,
  } = options;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const currentStrokeRef = useRef<Point[]>([]);
  const strokeLetterIndexRef = useRef<number | undefined>(undefined);
  const getStrokeLetterIndexRef = useRef(getStrokeLetterIndex);
  getStrokeLetterIndexRef.current = getStrokeLetterIndex;
  const lastPointTimeRef = useRef<number>(0);
  const activeTouchIdRef = useRef<number | null>(null);
  const usingTouchRef = useRef(false);

  // Use refs to always access the latest callbacks (avoids stale closures)
  // Update refs synchronously during render for immediate access
  const pointFilterRef = useRef(pointFilter);
  const onPointAcceptedRef = useRef(onPointAccepted);
  const onPointRejectedRef = useRef(onPointRejected);
  const onStrokeStartRef = useRef(onStrokeStart);
  const onStrokeEndRef = useRef(onStrokeEnd);

  // Update refs synchronously (not in useEffect) so changes are immediate
  pointFilterRef.current = pointFilter;
  onPointAcceptedRef.current = onPointAccepted;
  onPointRejectedRef.current = onPointRejected;
  onStrokeStartRef.current = onStrokeStart;
  onStrokeEndRef.current = onStrokeEnd;

  // Convert client coordinates to SVG coordinates using screen CTM
  const getPointFromClient = useCallback(
    (clientX: number, clientY: number, svg: SVGSVGElement): Point | null => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;

      const point = svg.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      const svgPoint = point.matrixTransform(ctm.inverse());
      return { x: svgPoint.x, y: svgPoint.y };
    },
    []
  );

  // Process a point through the filter (uses refs to avoid stale closures)
  const processPoint = useCallback(
    (point: Point): boolean => {
      const filter = pointFilterRef.current;
      if (!filter) {
        // No filter, accept all points
        currentStrokeRef.current.push(point);
        return true;
      }

      const result = filter(point);
      if (result.accepted) {
        currentStrokeRef.current.push(point);
        onPointAcceptedRef.current?.(point, result.segmentIndex ?? -1);
        return true;
      } else {
        onPointRejectedRef.current?.(point);
        return false;
      }
    },
    [] // No dependencies - always reads from refs
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (usingTouchRef.current) return;
      // Prevent default to stop iOS scroll/zoom behaviors
      e.preventDefault();

      const svg = e.currentTarget;
      svg.setPointerCapture(e.pointerId);

      const point = getPointFromClient(e.clientX, e.clientY, svg);
      if (point) {
        currentStrokeRef.current = [];
        strokeLetterIndexRef.current = getStrokeLetterIndexRef.current?.();
        lastPointTimeRef.current = Date.now();
        setIsDrawing(true);
        onStrokeStartRef.current?.();
        processPoint(point);
        // Update current stroke state for rendering
        setCurrentStroke({ points: [...currentStrokeRef.current], letterIndex: strokeLetterIndexRef.current });
      }
    },
    [getPointFromClient, processPoint]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (usingTouchRef.current) return;
      // Always prevent default on move to ensure smooth drawing on iOS
      e.preventDefault();

      if (!isDrawing) return;

      // Throttle point sampling
      const now = Date.now();
      if (now - lastPointTimeRef.current < throttleMs) {
        return;
      }
      lastPointTimeRef.current = now;

      const point = getPointFromClient(e.clientX, e.clientY, e.currentTarget);
      if (point) {
        processPoint(point);
        // Update current stroke state for rendering
        setCurrentStroke({ points: [...currentStrokeRef.current], letterIndex: strokeLetterIndexRef.current });
      }
    },
    [isDrawing, throttleMs, getPointFromClient, processPoint]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (usingTouchRef.current) return;
      e.preventDefault();

      if (!isDrawing) return;

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore errors if pointer capture wasn't set
      }

      // Finalize the current stroke - persist to strokes array
      if (currentStrokeRef.current.length > 0) {
        const finalStroke = { points: [...currentStrokeRef.current], letterIndex: strokeLetterIndexRef.current };
        setStrokes((prev) => [...prev, finalStroke]);
      }
      currentStrokeRef.current = [];
      setCurrentStroke(null);
      setIsDrawing(false);
      onStrokeEndRef.current?.();
    },
    [isDrawing]
  );

  const handlePointerLeave = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      // Treat leaving the area as ending the stroke
      if (isDrawing) {
        handlePointerUp(e);
      }
    },
    [isDrawing, handlePointerUp]
  );

  // Cancel handler to handle interrupted touches on iOS
  const handlePointerCancel = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (usingTouchRef.current) return;
      if (isDrawing) {
        // Save any progress made
        if (currentStrokeRef.current.length > 0) {
          const finalStroke = { points: [...currentStrokeRef.current], letterIndex: strokeLetterIndexRef.current };
          setStrokes((prev) => [...prev, finalStroke]);
        }
        currentStrokeRef.current = [];
        setCurrentStroke(null);
        setIsDrawing(false);
        onStrokeEndRef.current?.();
      }
    },
    [isDrawing]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent<SVGSVGElement>) => {
      e.preventDefault();

      const touch = e.changedTouches[0];
      if (!touch) return;

      const svg = e.currentTarget;
      usingTouchRef.current = true;
      activeTouchIdRef.current = touch.identifier;

      currentStrokeRef.current = [];
      strokeLetterIndexRef.current = getStrokeLetterIndexRef.current?.();
      lastPointTimeRef.current = Date.now();
      setIsDrawing(true);
      onStrokeStartRef.current?.();

      const point = getPointFromClient(touch.clientX, touch.clientY, svg);
      if (point) {
        processPoint(point);
        setCurrentStroke({ points: [...currentStrokeRef.current], letterIndex: strokeLetterIndexRef.current });
      }
    },
    [getPointFromClient, processPoint]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<SVGSVGElement>) => {
      if (!usingTouchRef.current || !isDrawing) return;
      e.preventDefault();

      const activeId = activeTouchIdRef.current;
      if (activeId === null) return;

      const touch = Array.from(e.touches).find((t) => t.identifier === activeId);
      if (!touch) return;

      const now = Date.now();
      if (now - lastPointTimeRef.current < throttleMs) {
        return;
      }
      lastPointTimeRef.current = now;

      const point = getPointFromClient(touch.clientX, touch.clientY, e.currentTarget);
      if (point) {
        processPoint(point);
        setCurrentStroke({ points: [...currentStrokeRef.current], letterIndex: strokeLetterIndexRef.current });
      }
    },
    [getPointFromClient, isDrawing, processPoint, throttleMs]
  );

  const finishTouchStroke = useCallback(() => {
    if (currentStrokeRef.current.length > 0) {
      const finalStroke = { points: [...currentStrokeRef.current], letterIndex: strokeLetterIndexRef.current };
      setStrokes((prev) => [...prev, finalStroke]);
    }
    currentStrokeRef.current = [];
    setCurrentStroke(null);
    setIsDrawing(false);
    activeTouchIdRef.current = null;
    usingTouchRef.current = false;
    onStrokeEndRef.current?.();
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent<SVGSVGElement>) => {
      e.preventDefault();
      if (!isDrawing) return;

      const activeId = activeTouchIdRef.current;
      if (activeId === null) return;

      const ended = Array.from(e.changedTouches).some(
        (t) => t.identifier === activeId
      );
      if (ended) {
        finishTouchStroke();
      }
    },
    [finishTouchStroke, isDrawing]
  );

  const handleTouchCancel = useCallback(
    (e: TouchEvent<SVGSVGElement>) => {
      e.preventDefault();
      if (!isDrawing) return;
      finishTouchStroke();
    },
    [finishTouchStroke, isDrawing]
  );

  const clearStrokes = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
    currentStrokeRef.current = [];
    activeTouchIdRef.current = null;
    usingTouchRef.current = false;
  }, []);

  /** Remove every stroke that was drawn while `letterIndex` was the active letter. */
  const clearStrokesForLetter = useCallback((letterIndex: number) => {
    setStrokes((prev) => prev.filter((stroke) => stroke.letterIndex !== letterIndex));
  }, []);

  return {
    strokes,
    isDrawing,
    currentStroke,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
      onPointerCancel: handlePointerCancel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
    clearStrokes,
    clearStrokesForLetter,
  };
}

/**
 * Convert a stroke to an SVG path d attribute
 */
export function strokeToPath(stroke: Stroke): string {
  if (stroke.points.length === 0) return '';
  if (stroke.points.length === 1) {
    // Single point - draw a small circle
    const p = stroke.points[0];
    return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y + 0.1}`;
  }

  const [first, ...rest] = stroke.points;
  let d = `M ${first.x} ${first.y}`;

  for (const point of rest) {
    d += ` L ${point.x} ${point.y}`;
  }

  return d;
}
