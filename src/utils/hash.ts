/**
 * Simple FNV-1a hash for cropped canvas region data.
 * Fast enough for real-time use without external lib.
 */
export function hashImageData(data: Uint8ClampedArray): string {
  let hash = 2166136261; // FNV offset basis (32-bit)
  // Sample every 4th pixel (RGBA) for speed – full data is too slow for large boxes
  for (let i = 0; i < data.length; i += 16) {
    hash ^= data[i];
    hash = (hash * 16777619) >>> 0; // FNV prime, keep 32-bit unsigned
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Crop a region from a canvas and return its hash.
 */
export function getBoxHash(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number
): string {
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.max(1, w);
  offscreen.height = Math.max(1, h);
  const ctx = offscreen.getContext('2d')!;
  ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
  return hashImageData(imageData.data);
}
