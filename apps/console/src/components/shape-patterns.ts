export interface PatternPoint {
  x: number;
  y: number;
}

export type PatternName = 'star' | 'heart' | 'spiral' | 'circle' | 'grid' | 'wave' | 'flower' | 'diamond';

export interface ShapePattern {
  name: PatternName;
  nameCn: string;
  points: PatternPoint[];
}

function generateStarPoints(arms: number = 5, outerR: number = 1, innerR: number = 0.38): PatternPoint[] {
  const result: PatternPoint[] = [];
  for (let i = 0; i < arms * 2; i++) {
    const angle = (Math.PI * i) / arms - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    result.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return result;
}

function generateHeartPoints(count: number = 80): PatternPoint[] {
  const result: PatternPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * 2 * Math.PI;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    result.push({ x: x / 17, y: y / 17 });
  }
  return result;
}

function generateSpiralPoints(count: number = 100): PatternPoint[] {
  const result: PatternPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * 5 * Math.PI;
    const r = 0.08 + (i / count) * 0.92;
    result.push({ x: Math.cos(t) * r, y: Math.sin(t) * r });
  }
  return result;
}

function generateCirclePoints(count: number = 80): PatternPoint[] {
  const result: PatternPoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    result.push({ x: Math.cos(angle), y: Math.sin(angle) });
  }
  return result;
}

function generateGridPoints(rows: number = 9, cols: number = 11): PatternPoint[] {
  const result: PatternPoint[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result.push({
        x: (c / Math.max(cols - 1, 1)) * 2 - 1,
        y: (r / Math.max(rows - 1, 1)) * 2 - 1,
      });
    }
  }
  return result;
}

function generateWavePoints(count: number = 80): PatternPoint[] {
  const result: PatternPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * 4 * Math.PI;
    const x = (i / Math.max(count - 1, 1)) * 2 - 1;
    const y = Math.sin(t) * 0.55;
    result.push({ x, y });
  }
  return result;
}

function generateFlowerPoints(petals: number = 6, count: number = 100): PatternPoint[] {
  const result: PatternPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * 2 * Math.PI;
    const r = Math.abs(Math.cos((petals / 2) * t)) * 0.9 + 0.1;
    result.push({ x: Math.cos(t) * r, y: Math.sin(t) * r });
  }
  return result;
}

function generateDiamondPoints(count: number = 80): PatternPoint[] {
  const result: PatternPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const side = Math.floor(t * 4);
    const localT = (t * 4) % 1;
    let x: number, y: number;
    switch (side) {
      case 0: x = localT; y = 0.5 + localT * 0.5; break;
      case 1: x = 1 + localT; y = 1 - localT * 0.5; break;
      case 2: x = 2 - localT; y = 0.5 - localT * 0.5; break;
      default: x = 1 - localT; y = localT * 0.5; break;
    }
    result.push({ x: (x - 1) * 1.2, y: (y - 0.5) * 2 });
  }
  return result;
}

export const PATTERNS: ShapePattern[] = [
  { name: 'star', nameCn: '星形', points: generateStarPoints() },
  { name: 'heart', nameCn: '心形', points: generateHeartPoints() },
  { name: 'spiral', nameCn: '螺旋', points: generateSpiralPoints() },
  { name: 'circle', nameCn: '圆环', points: generateCirclePoints() },
  { name: 'grid', nameCn: '网格', points: generateGridPoints() },
  { name: 'wave', nameCn: '波浪', points: generateWavePoints() },
  { name: 'flower', nameCn: '花朵', points: generateFlowerPoints() },
  { name: 'diamond', nameCn: '钻石', points: generateDiamondPoints() },
];

export function assignNodesToPattern(
  nodeIds: string[],
  importanceMap: Map<string, number>,
  pattern: ShapePattern,
  scale: number = 1200
): Map<string, { x: number; y: number }> {
  const sorted = nodeIds.slice().sort((a, b) => (importanceMap.get(b) || 0) - (importanceMap.get(a) || 0));
  const result = new Map<string, { x: number; y: number }>();
  const points = pattern.points;

  for (let i = 0; i < sorted.length; i++) {
    const nodeId = sorted[i];
    if (i < points.length) {
      result.set(nodeId, { x: points[i].x * scale, y: points[i].y * scale });
    } else {
      const overflowIdx = i - points.length;
      const angle = ((overflowIdx * 137.5) * Math.PI) / 180;
      const r = 40 + Math.sqrt(overflowIdx) * 35;
      result.set(nodeId, { x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
  }

  return result;
}
