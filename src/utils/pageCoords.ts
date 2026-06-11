import { BoundingBox } from '../types';

export interface PageMetrics {
  scaleX: number;
  scaleY: number;
  displayWidth: number;
  displayHeight: number;
  naturalWidth: number;
  naturalHeight: number;
}

export function getPageMetrics(img: HTMLImageElement | null): PageMetrics | null {
  if (!img || img.naturalWidth <= 0 || img.naturalHeight <= 0) return null;

  const displayWidth = img.clientWidth;
  const displayHeight = img.clientHeight;
  if (displayWidth <= 0 || displayHeight <= 0) return null;

  return {
    displayWidth,
    displayHeight,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    scaleX: displayWidth / img.naturalWidth,
    scaleY: displayHeight / img.naturalHeight,
  };
}

export function clientToDisplay(clientX: number, clientY: number, img: HTMLImageElement) {
  const rect = img.getBoundingClientRect();
  return {
    px: clientX - rect.left,
    py: clientY - rect.top,
  };
}

export function displayRectToImageBox(
  x0: number,
  y0: number,
  w: number,
  h: number,
  metrics: PageMetrics
): Pick<BoundingBox, 'x' | 'y' | 'w' | 'h'> {
  return {
    x: Math.max(0, Math.round(x0 / metrics.scaleX)),
    y: Math.max(0, Math.round(y0 / metrics.scaleY)),
    w: Math.max(1, Math.round(w / metrics.scaleX)),
    h: Math.max(1, Math.round(h / metrics.scaleY)),
  };
}

export function hitTestBox(
  px: number,
  py: number,
  boxes: BoundingBox[],
  metrics: PageMetrics
): BoundingBox | null {
  for (let i = boxes.length - 1; i >= 0; i--) {
    const b = boxes[i];
    const left = b.x * metrics.scaleX;
    const top = b.y * metrics.scaleY;
    const right = (b.x + b.w) * metrics.scaleX;
    const bottom = (b.y + b.h) * metrics.scaleY;
    if (px >= left && px <= right && py >= top && py <= bottom) return b;
  }
  return null;
}
