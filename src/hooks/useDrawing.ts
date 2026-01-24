'use client';

import { useState, useCallback, useRef, PointerEvent } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
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
  } = options;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const currentStrokeRef = useRef<Point[]>([]);
  const lastPointTimeRef = useRef<number>(0);

  // Use refs to always access the latest callbacks (avoids stale closures)
  // Update refs synchronously during render for immediate access
  const pointFilterRef = useRef(pointFilter);
  const onPointAcceptedRef = useRef(onPointAccepted);
  const onPointRejectedRef = useRef(onPointRejected);

  // Update refs synchronously (not in useEffect) so changes are immediate
  pointFilterRef.current = pointFilter;
  onPointAcceptedRef.current = onPointAccepted;
  onPointRejectedRef.current = onPointRejected;

  // Convert pointer event to SVG coordinates
  const getPointFromEvent = useCallback(
    (e: PointerEvent<SVGSVGElement>, svg: SVGSVGElement): Point | null => {
      const rect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;

      if (!viewBox || viewBox.width === 0 || viewBox.height === 0) {
        return null;
      }

      // Convert screen coords to SVG viewBox coords
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX + viewBox.x;
      const y = (e.clientY - rect.top) * scaleY + viewBox.y;

      return { x, y };
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
      const svg = e.currentTarget;
      svg.setPointerCapture(e.pointerId);

      const point = getPointFromEvent(e, svg);
      if (point) {
        currentStrokeRef.current = [];
        lastPointTimeRef.current = Date.now();
        setIsDrawing(true);
        processPoint(point);
        // Update current stroke state for rendering
        setCurrentStroke({ points: [...currentStrokeRef.current] });
      }
    },
    [getPointFromEvent, processPoint]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (!isDrawing) return;

      // Throttle point sampling
      const now = Date.now();
      if (now - lastPointTimeRef.current < throttleMs) {
        return;
      }
      lastPointTimeRef.current = now;

      const point = getPointFromEvent(e, e.currentTarget);
      if (point) {
        processPoint(point);
        // Update current stroke state for rendering
        setCurrentStroke({ points: [...currentStrokeRef.current] });
      }
    },
    [isDrawing, throttleMs, getPointFromEvent, processPoint]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (!isDrawing) return;

      e.currentTarget.releasePointerCapture(e.pointerId);

      // Finalize the current stroke - persist to strokes array
      if (currentStrokeRef.current.length > 0) {
        const finalStroke = { points: [...currentStrokeRef.current] };
        setStrokes((prev) => [...prev, finalStroke]);
      }
      currentStrokeRef.current = [];
      setCurrentStroke(null);
      setIsDrawing(false);
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

  const clearStrokes = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
    currentStrokeRef.current = [];
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
    },
    clearStrokes,
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
