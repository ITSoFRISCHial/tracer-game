/**
 * Dev Notes: Path Utilities for Hit-Testing
 *
 * This module provides utilities for working with SVG paths:
 * - Discretizing paths into points for distance calculations
 * - Hit-testing to check if a point is within the corridor
 * - Finding the nearest point on a path
 *
 * Performance notes for iPad:
 * - Path discretization is done once when the component mounts
 * - Distance calculations use squared distance to avoid sqrt
 * - Linear scan is O(n) but fast enough for n=120 segments
 */

import { Point } from '@/hooks/useDrawing';

export interface PathPoint {
  x: number;
  y: number;
  t: number; // Position along path (0-1)
}

/**
 * Parse an SVG path and discretize it into N points.
 * Uses a temporary SVG element to leverage native path methods.
 */
export function discretizePath(
  pathData: string,
  numSegments: number = 120
): PathPoint[] {
  // Create a temporary SVG path element
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);
  document.body.appendChild(svg);

  const totalLength = path.getTotalLength();
  const points: PathPoint[] = [];

  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const length = t * totalLength;
    const point = path.getPointAtLength(length);
    points.push({
      x: point.x,
      y: point.y,
      t,
    });
  }

  // Clean up
  document.body.removeChild(svg);

  return points;
}

/**
 * Find the squared distance between two points.
 * Using squared distance avoids expensive sqrt calculations.
 */
export function squaredDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

/**
 * Find the nearest point on a discretized path to a given point.
 * Returns the path point and its index.
 */
export function findNearestPathPoint(
  point: Point,
  pathPoints: PathPoint[]
): { point: PathPoint; index: number; distance: number } {
  let nearestIndex = 0;
  let nearestDistSq = Infinity;

  for (let i = 0; i < pathPoints.length; i++) {
    const distSq = squaredDistance(point, pathPoints[i]);
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearestIndex = i;
    }
  }

  return {
    point: pathPoints[nearestIndex],
    index: nearestIndex,
    distance: Math.sqrt(nearestDistSq),
  };
}

/**
 * Check if a point is within the corridor of a path.
 * The corridor is defined by a radius around the path.
 */
export function isPointInCorridor(
  point: Point,
  pathPoints: PathPoint[],
  corridorRadius: number
): { inCorridor: boolean; nearestIndex: number; distance: number } {
  const result = findNearestPathPoint(point, pathPoints);
  return {
    inCorridor: result.distance <= corridorRadius,
    nearestIndex: result.index,
    distance: result.distance,
  };
}

/**
 * Get corridor radius scaled for different screen sizes.
 * Base radius is 21 (42px width / 2) at standard size.
 */
export function getCorridorRadius(scale: number = 1): number {
  const BASE_RADIUS = 21;
  return BASE_RADIUS * scale;
}
