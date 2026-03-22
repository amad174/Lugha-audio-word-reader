import { BoundingBox, AudioMapping } from '../types';

export function drawBoxes(
  canvas: HTMLCanvasElement,
  boxes: BoundingBox[],
  mappings: AudioMapping,
  hoveredId: string | null,
  selectedId: string | null,
  scaleX: number,
  scaleY: number,
  drawPreview?: { x: number; y: number; w: number; h: number } | null
): void {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const box of boxes) {
    const isMapped = !!mappings[box.id];
    const isHovered = box.id === hoveredId;
    const isSelected = box.id === selectedId;

    const rx = box.x * scaleX;
    const ry = box.y * scaleY;
    const rw = box.w * scaleX;
    const rh = box.h * scaleY;

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
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(52,152,219,0.06)';
    }

    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);

    // Green dot = has audio
    if (isMapped) {
      ctx.beginPath();
      ctx.arc(rx + rw - 5, ry + 5, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#2ecc71';
      ctx.fill();
    }

    ctx.restore();
  }

  // In-progress draw preview
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
