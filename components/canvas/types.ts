export type Tool = "brush" | "pencil" | "eraser" | "select";

export type Point = {
  x: number;
  y: number;
};

export type Stroke = {
  id: string;
  points: Point[];
  color: string;
  size: number;
  tool: Tool;
  angle?: number;
  centerX?: number;
  centerY?: number;
};

export type CursorData = {
  id: string;
  name: string;
  avatarSeed?: string;
  x: number;
  y: number;
  color: string;
  lastUpdated: number;
  currentStroke?: Stroke;
};
