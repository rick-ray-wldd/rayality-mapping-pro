import { Point, Size } from './types';

/**
 * Solves a linear system of equations of the form Ax = b
 * Used for Homography calculation.
 */
function solve(A: number[][], b: number[]): number[] {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    // Search for maximum in this column
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    // Swap maximum row with current row (column by column)
    for (let k = i; k < n; k++) {
      const tmp = A[maxRow][k];
      A[maxRow][k] = A[i][k];
      A[i][k] = tmp;
    }
    const tmp = b[maxRow];
    b[maxRow] = b[i];
    b[i] = tmp;

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k][j] = 0;
        } else {
          A[k][j] += c * A[i][j];
        }
      }
      b[k] += c * b[i];
    }
  }

  // Solve equation Ax=b for an upper triangular matrix A
  const x = new Array(n).fill(0);
  for (let i = n - 1; i > -1; i--) {
    let sum = 0;
    for (let k = i + 1; k < n; k++) {
      sum += A[i][k] * x[k];
    }
    x[i] = (b[i] - sum) / A[i][i];
  }
  return x;
}

/**
 * Computes the CSS matrix3d string to map a standard DOM element (rect) 
 * to 4 arbitrary points (quad).
 */
export function getPerspectiveTransform(
  srcWidth: number,
  srcHeight: number,
  dstPoints: [Point, Point, Point, Point]
): string {
  const x0 = 0, y0 = 0;
  const x1 = srcWidth, y1 = 0;
  const x2 = srcWidth, y2 = srcHeight;
  const x3 = 0, y3 = srcHeight;

  const u0 = dstPoints[0].x, v0 = dstPoints[0].y;
  const u1 = dstPoints[1].x, v1 = dstPoints[1].y;
  const u2 = dstPoints[2].x, v2 = dstPoints[2].y;
  const u3 = dstPoints[3].x, v3 = dstPoints[3].y;

  const A: number[][] = [];
  const b: number[] = [];

  const addPoint = (x: number, y: number, u: number, v: number) => {
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    b.push(v);
  };

  addPoint(x0, y0, u0, v0);
  addPoint(x1, y1, u1, v1);
  addPoint(x2, y2, u2, v2);
  addPoint(x3, y3, u3, v3);

  const h = solve(A, b);

  return `matrix3d(
    ${h[0]}, ${h[3]}, 0, ${h[6]},
    ${h[1]}, ${h[4]}, 0, ${h[7]},
    0, 0, 1, 0,
    ${h[2]}, ${h[5]}, 0, 1
  )`;
}

// --- Geometric Helpers ---

export function getCentroid(points: Point[]): Point {
  const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  return { x, y };
}

export function getBoundingBox(points: Point[]): { x: number, y: number, width: number, height: number } {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export function translatePoints(points: [Point, Point, Point, Point], dx: number, dy: number): [Point, Point, Point, Point] {
  return points.map(p => ({ x: p.x + dx, y: p.y + dy })) as [Point, Point, Point, Point];
}

export function scalePoints(
  points: [Point, Point, Point, Point], 
  scaleX: number, 
  scaleY: number, 
  origin: Point
): [Point, Point, Point, Point] {
  return points.map(p => ({
    x: origin.x + (p.x - origin.x) * scaleX,
    y: origin.y + (p.y - origin.y) * scaleY
  })) as [Point, Point, Point, Point];
}

export function rotatePoints(
  points: [Point, Point, Point, Point], 
  angleDegrees: number, 
  origin: Point
): [Point, Point, Point, Point] {
  const rad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return points.map(p => {
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    return {
      x: origin.x + (dx * cos - dy * sin),
      y: origin.y + (dx * sin + dy * cos)
    };
  }) as [Point, Point, Point, Point];
}