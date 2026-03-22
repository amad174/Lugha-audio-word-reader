import { BoundingBox } from '../types';
import { getBoxHash } from './hash';

declare const cv: any;

let cvReady = false;

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
 * Detect bounding boxes for Arabic letters/words.
 *
 * Strategy:
 *  1. Grayscale → threshold (RETR_LIST gets ALL contours, not just external,
 *     so letters inside decorative borders are included)
 *  2. Dilate horizontally to merge nearby strokes into word/letter clusters
 *  3. Find contours on dilated image → word-level boxes
 *  4. Filter noise and overly large regions (page border, etc.)
 *  5. Sort right-to-left, top-to-bottom (Arabic reading order)
 */
export function detectBoxes(
  imageCanvas: HTMLCanvasElement,
  options: {
    minArea?: number;
    maxArea?: number;
    padding?: number;
    dilateW?: number;
    dilateH?: number;
  } = {}
): BoundingBox[] {
  const {
    minArea = 200,
    maxArea = 0.08, // fraction of total image area (filters page border)
    padding = 5,
    dilateW = 18,   // horizontal dilation merges Arabic letter strokes into words
    dilateH = 8,
  } = options;

  const totalArea = imageCanvas.width * imageCanvas.height;
  const maxPx = typeof maxArea === 'number' && maxArea < 1
    ? totalArea * maxArea
    : (maxArea as number);

  const src = cv.imread(imageCanvas);
  const gray = new cv.Mat();
  const thresh = new cv.Mat();
  const dilated = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Adaptive threshold – handles uneven lighting in scanned pages
    cv.adaptiveThreshold(
      gray,
      thresh,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      21,
      10
    );

    // Dilate to merge nearby Arabic strokes/dots into single word blobs
    const kernel = cv.getStructuringElement(
      cv.MORPH_RECT,
      new cv.Size(dilateW, dilateH)
    );
    cv.dilate(thresh, dilated, kernel);
    kernel.delete();

    // RETR_EXTERNAL on the *dilated* image gives us merged word clusters
    cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const boxes: BoundingBox[] = [];

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const rect = cv.boundingRect(cnt);
      cnt.delete();

      const area = rect.width * rect.height;
      if (area < minArea || area > maxPx) continue;

      // Skip extremely wide boxes (likely full-page decorative lines)
      if (rect.width > imageCanvas.width * 0.85) continue;
      // Skip extremely tall boxes
      if (rect.height > imageCanvas.height * 0.35) continue;

      const x = Math.max(0, rect.x - padding);
      const y = Math.max(0, rect.y - padding);
      const w = Math.min(imageCanvas.width - x, rect.width + padding * 2);
      const h = Math.min(imageCanvas.height - y, rect.height + padding * 2);

      const id = getBoxHash(imageCanvas, x, y, w, h);
      boxes.push({ x, y, w, h, id });
    }

    // Sort: top-to-bottom rows, right-to-left within each row (Arabic)
    boxes.sort((a, b) => {
      const rowThreshold = Math.min(a.h, b.h) * 0.5;
      const sameRow = Math.abs(a.y - b.y) < rowThreshold;
      if (sameRow) return b.x - a.x;
      return a.y - b.y;
    });

    return boxes;
  } finally {
    src.delete();
    gray.delete();
    thresh.delete();
    dilated.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Draw all boxes on the overlay canvas.
 */
export function drawBoxes(
  overlayCanvas: HTMLCanvasElement,
  boxes: BoundingBox[],
  mappings: { [hash: string]: string },
  hoveredId: string | null,
  selectedId: string | null,
  scaleX: number,
  scaleY: number,
  drawPreview?: { x: number; y: number; w: number; h: number } | null
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
      ctx.strokeStyle = 'rgba(52,152,219,0.55)';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(52,152,219,0.04)';
    }

    const rx = box.x * scaleX;
    const ry = box.y * scaleY;
    const rw = box.w * scaleX;
    const rh = box.h * scaleY;

    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);

    if (isMapped) {
      ctx.beginPath();
      ctx.arc(rx + rw - 5, ry + 5, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#2ecc71';
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw in-progress manual box
  if (drawPreview && drawPreview.w > 4 && drawPreview.h > 4) {
    ctx.save();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.fillStyle = 'rgba(231,76,60,0.12)';
    ctx.fillRect(drawPreview.x, drawPreview.y, drawPreview.w, drawPreview.h);
    ctx.strokeRect(drawPreview.x, drawPreview.y, drawPreview.w, drawPreview.h);
    ctx.restore();
  }
}
