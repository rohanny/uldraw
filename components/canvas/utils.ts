import { Stroke, Point } from "./types";

export const pointToLineDistance = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  // Handle Case where line is just a point
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

export const isPointNearStroke = (
  x: number,
  y: number,
  stroke: Stroke,
  eraserSize: number
) => {
  const eraserRadius = eraserSize / 2;
  const hitRadius = (stroke.size / 2) + eraserRadius;

  // Check if point is near any line segment of the stroke
  for (let i = 1; i < stroke.points.length; i++) {
    const p1 = stroke.points[i - 1];
    const p2 = stroke.points[i];
    const dist = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
    if (dist <= hitRadius) return true;
  }

  // Check dot
  if (stroke.points.length === 1) {
    const p = stroke.points[0];
    const dx = x - p.x;
    const dy = y - p.y;
    if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) return true;
  }

  return false;
};

export type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export const getBoundingBox = (points: Point[], padding = 0): BoundingBox => {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

export const isPointInBox = (px: number, py: number, box: BoundingBox): boolean => {
  return px >= box.minX && px <= box.maxX && py >= box.minY && py <= box.maxY;
};

export const doBoxesIntersect = (box1: BoundingBox, box2: BoundingBox): boolean => {
  return !(
    box2.minX > box1.maxX ||
    box2.maxX < box1.minX ||
    box2.minY > box1.maxY ||
    box2.maxY < box1.minY
  );
};

export const rotatePoint = (x: number, y: number, cx: number, cy: number, angle: number): Point => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const nx = (cos * (x - cx)) - (sin * (y - cy)) + cx;
  const ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;
  return { x: nx, y: ny };
};

export const distanceToPoint = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};

export const applyTransform = (points: Point[], box: BoundingBox, startX: number, startY: number, x: number, y: number, handle: string): Point[] => {
  const dx = x - startX;
  const dy = y - startY;

  if (handle === "move") {
    return points.map(p => ({ x: p.x + dx, y: p.y + dy }));
  }

  const { minX, minY, maxX, maxY, width, height, centerX, centerY } = box;
  if (width === 0 || height === 0) return points;

  // Note: rotation handle is now managed by changing the Stroke's `angle` property in index.tsx
  // This applyTransform function is now just for resizing bounding boxes directly.

  let scaleX = 1;
  let scaleY = 1;
  let originX = minX;
  let originY = minY;

  if (handle === "BR") {
    scaleX = Math.max(0.1, (width + dx) / width);
    scaleY = Math.max(0.1, (height + dy) / height);
    originX = minX;
    originY = minY;
  } else if (handle === "TL") {
    scaleX = Math.max(0.1, (width - dx) / width);
    scaleY = Math.max(0.1, (height - dy) / height);
    originX = maxX;
    originY = maxY;
  } else if (handle === "TR") {
    scaleX = Math.max(0.1, (width + dx) / width);
    scaleY = Math.max(0.1, (height - dy) / height);
    originX = minX;
    originY = maxY;
  } else if (handle === "BL") {
    scaleX = Math.max(0.1, (width - dx) / width);
    scaleY = Math.max(0.1, (height + dy) / height);
    originX = maxX;
    originY = minY;
  }

  return points.map(p => ({
    x: originX + (p.x - originX) * scaleX,
    y: originY + (p.y - originY) * scaleY
  }));
};
