import { BoundingBox, AudioMapping } from '../types';

const PRIMARY = '#20614c';
const ERROR = '#d94b4b';
const UNMAPPED = '#6d9189';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawBoxes(
  canvas: HTMLCanvasElement,
  boxes: BoundingBox[],
  mappings: AudioMapping,
  hoveredId: string | null,
  selectedId: string | null,
  scaleX: number,
  scaleY: number,
  drawPreview?: { x: number; y: number; w: number; h: number } | null,
  deleteMode = false,
  playMode = false
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

    if (playMode && !deleteMode) {
      // Reading view: soft rounded highlights that don't obscure the page.
      if (isSelected || isHovered) {
        ctx.strokeStyle = 'rgba(32,97,76,0.55)';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(32,97,76,0.16)';
      } else if (isMapped) {
        ctx.strokeStyle = 'rgba(32,97,76,0.22)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(32,97,76,0.07)';
      } else {
        // Teacher previewing play mode: hint at boxes still missing audio.
        ctx.strokeStyle = 'rgba(109,145,137,0.3)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(109,145,137,0.04)';
      }
      roundRectPath(ctx, rx, ry, rw, rh, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (deleteMode && isHovered) {
      ctx.strokeStyle = ERROR;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(217,75,75,0.2)';
    } else if (isSelected) {
      ctx.strokeStyle = PRIMARY;
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(32,97,76,0.25)';
    } else if (isHovered) {
      ctx.strokeStyle = isMapped ? PRIMARY : UNMAPPED;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = isMapped ? 'rgba(32,97,76,0.2)' : 'rgba(109,145,137,0.2)';
    } else if (isMapped) {
      ctx.strokeStyle = PRIMARY;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(32,97,76,0.08)';
    } else {
      ctx.strokeStyle = 'rgba(109,145,137,0.55)';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(109,145,137,0.06)';
    }

    roundRectPath(ctx, rx, ry, rw, rh, 6);
    ctx.fill();
    ctx.stroke();

    if (isMapped && !deleteMode) {
      ctx.beginPath();
      ctx.arc(rx + rw - 6, ry + 6, 4, 0, Math.PI * 2);
      ctx.fillStyle = PRIMARY;
      ctx.fill();
    }

    if (deleteMode && isHovered) {
      const cx = rx + rw / 2;
      const cy = ry + rh / 2;
      const s = Math.min(rw, rh) * 0.25;
      ctx.strokeStyle = ERROR;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
      ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
      ctx.stroke();
    }

    ctx.restore();
  }

  if (drawPreview && drawPreview.w > 4 && drawPreview.h > 4) {
    ctx.save();
    ctx.strokeStyle = ERROR;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.fillStyle = 'rgba(217,75,75,0.12)';
    ctx.fillRect(drawPreview.x, drawPreview.y, drawPreview.w, drawPreview.h);
    ctx.strokeRect(drawPreview.x, drawPreview.y, drawPreview.w, drawPreview.h);
    ctx.restore();
  }
}
