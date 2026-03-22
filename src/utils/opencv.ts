import { BoundingBox } from '../types';
import { getBoxHash } from './hash';

declare const cv: any;

let cvReady = false;

/** Resolves when OpenCV is loaded and ready */
export function waitForOpenCV(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof cv !== 'undefined' && cv.Mat) {
      cvReady = true;
      resolve();
      return;
    }
    const check = setInterval(() => {
      if (typeof cv !== 'undefined' && cv.Mat) {
        cvReady = true;
        clearInterval(check);
        resolve();
      }
    }, 200);
  });
}

export function isOpenCVReady(): boolean {
  return cvReady;
}

/**
 * Detect bounding boxes for Arabic letters/words in an image.
 * Uses adaptive threshold + contour detection.
 * Returns boxes sorted right-to-left, top-to-bottom (Arabic reading order).
 */
export function detectBoxes(
  imageCanvas: HTMLCanvasElement,
  options: {
    minArea?: number;
    maxArea?: number;
    padding?: number;
  } = {}
): BoundingBox[] {
  const { minArea = 100, maxArea = 50000, padding = 4 } = options;

  const src = cv.imread(imageCanvas);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const thresh = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    // 1. Grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 2. Slight blur to reduce noise
    cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);

    // 3. Adaptive threshold – works well for scanned book pages
    cv.adaptiveThreshold(
      blurred,
      thresh,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      15,
      8
    );

    // 4. Find contours
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const boxes: BoundingBox[] = [];

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const rect = cv.boundingRect(cnt);
      const area = rect.width * rect.height;

      if (area >= minArea && area <= maxArea) {
        // Apply padding (clamped to canvas bounds)
        const x = Math.max(0, rect.x - padding);
        const y = Math.max(0, rect.y - padding);
        const w = Math.min(imageCanvas.width - x, rect.width + padding * 2);
        const h = Math.min(imageCanvas.height - y, rect.height + padding * 2);

        const id = getBoxHash(imageCanvas, x, y, w, h);
        boxes.push({ x, y, w, h, id });
      }
      cnt.delete();
    }

    // Sort: top-to-bottom rows, right-to-left within rows (Arabic)
    boxes.sort((a, b) => {
      const rowDiff = Math.abs(a.y - b.y);
      if (rowDiff > 20) return a.y - b.y;
      return b.x - a.x; // right-to-left
    });

    return boxes;
  } finally {
    src.delete();
    gray.delete();
    blurred.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Draw boxes on an overlay canvas.
 */
export function drawBoxes(
  overlayCanvas: HTMLCanvasElement,
  boxes: BoundingBox[],
  mappings: { [hash: string]: string },
  hoveredId: string | null,
  selectedId: string | null,
  scaleX: number,
  scaleY: number
): void {
  const ctx = overlayCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  for (const box of boxes) {
    const isMapped = !!mappings[box.id];
    const isHovered = box.id === hoveredId;
    const isSelected = box.id === selectedId;

    ctx.save();

    if (isSelected) {
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(243,156,18,0.25)';
    } else if (isHovered) {
      ctx.strokeStyle = isMapped ? '#2ecc71' : '#3498db';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = isMapped ? 'rgba(46,204,113,0.2)' : 'rgba(52,152,219,0.2)';
    } else if (isMapped) {
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(39,174,96,0.08)';
    } else {
      ctx.strokeStyle = 'rgba(52,152,219,0.6)';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(52,152,219,0.04)';
    }

    const rx = box.x * scaleX;
    const ry = box.y * scaleY;
    const rw = box.w * scaleX;
    const rh = box.h * scaleY;

    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);

    // Small dot indicator if mapped
    if (isMapped) {
      ctx.beginPath();
      ctx.arc(rx + rw - 4, ry + 4, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#2ecc71';
      ctx.fill();
    }

    ctx.restore();
  }
}
