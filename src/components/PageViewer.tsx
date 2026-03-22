import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BoundingBox, AudioMapping, AppMode } from '../types';
import { drawBoxes } from '../utils/canvas';
import { getBoxHash } from '../utils/hash';
import { playAudio } from '../utils/audio';
import styles from './PageViewer.module.css';

interface Props {
  imageSrc: string;
  mappings: AudioMapping;
  mode: AppMode;
  boxes: BoundingBox[];
  onBoxClick: (box: BoundingBox) => void;
  onBoxAdd: (box: BoundingBox) => void;
}

interface DrawState {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const EMPTY_DRAW: DrawState = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };

export const PageViewer: React.FC<Props> = ({
  imageSrc, mappings, mode, boxes, onBoxClick, onBoxAdd,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [draw, setDraw] = useState<DrawState>(EMPTY_DRAW);

  const updateScale = useCallback(() => {
    if (!imgRef.current || imgNatural.w === 0) return;
    const r = imgRef.current.getBoundingClientRect();
    setScaleX(r.width / imgNatural.w);
    setScaleY(r.height / imgNatural.h);
    if (overlayRef.current) {
      overlayRef.current.width = r.width;
      overlayRef.current.height = r.height;
    }
  }, [imgNatural]);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    // render image to offscreen canvas so getBoxHash can sample pixels
    const canvas = imageCanvasRef.current!;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  // Redraw overlay
  useEffect(() => {
    if (!overlayRef.current) return;
    const preview = draw.active
      ? { x: Math.min(draw.startX, draw.currentX), y: Math.min(draw.startY, draw.currentY),
          w: Math.abs(draw.currentX - draw.startX), h: Math.abs(draw.currentY - draw.startY) }
      : null;
    drawBoxes(overlayRef.current, boxes, mappings, hoveredId, selectedId, scaleX, scaleY, preview);
  }, [boxes, mappings, hoveredId, selectedId, scaleX, scaleY, draw]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toCanvasXY = useCallback((clientX: number, clientY: number) => {
    const r = overlayRef.current?.getBoundingClientRect();
    if (!r) return { px: 0, py: 0 };
    return { px: clientX - r.left, py: clientY - r.top };
  }, []);

  const getBoxAt = useCallback((clientX: number, clientY: number): BoundingBox | null => {
    const { px, py } = toCanvasXY(clientX, clientY);
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (px >= b.x * scaleX && px <= (b.x + b.w) * scaleX &&
          py >= b.y * scaleY && py <= (b.y + b.h) * scaleY) return b;
    }
    return null;
  }, [boxes, scaleX, scaleY, toCanvasXY]);

  const clientOf = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      const t = e.touches[0] ?? (e as React.TouchEvent).changedTouches[0];
      return { clientX: t.clientX, clientY: t.clientY };
    }
    return { clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY };
  };

  // ── Pointer handlers ──────────────────────────────────────────────────────

  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'draw') return;
    const { clientX, clientY } = clientOf(e);
    const { px, py } = toCanvasXY(clientX, clientY);
    setDraw({ active: true, startX: px, startY: py, currentX: px, currentY: py });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, toCanvasXY]);

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const { clientX, clientY } = clientOf(e);
    if (mode === 'draw') {
      if (!draw.active) return;
      const { px, py } = toCanvasXY(clientX, clientY);
      setDraw(prev => ({ ...prev, currentX: px, currentY: py }));
    } else {
      setHoveredId(getBoxAt(clientX, clientY)?.id ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, draw.active, toCanvasXY, getBoxAt]);

  const onUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (mode === 'draw' && draw.active) {
      setDraw(EMPTY_DRAW);
      const pw = Math.abs(draw.currentX - draw.startX);
      const ph = Math.abs(draw.currentY - draw.startY);
      if (pw < 12 || ph < 12) return;

      const x0 = Math.min(draw.startX, draw.currentX);
      const y0 = Math.min(draw.startY, draw.currentY);
      const imgX = Math.max(0, Math.round(x0 / scaleX));
      const imgY = Math.max(0, Math.round(y0 / scaleY));
      const imgW = Math.round(pw / scaleX);
      const imgH = Math.round(ph / scaleY);

      const id = imageCanvasRef.current
        ? getBoxHash(imageCanvasRef.current, imgX, imgY, imgW, imgH)
        : `${imgX}-${imgY}-${imgW}-${imgH}`;

      const newBox: BoundingBox = { x: imgX, y: imgY, w: imgW, h: imgH, id };
      setSelectedId(id);
      onBoxAdd(newBox);
      return;
    }

    const { clientX, clientY } = clientOf(e);
    const box = getBoxAt(clientX, clientY);
    if (!box) return;
    setSelectedId(box.id);

    if (mode === 'assign') {
      onBoxClick(box);
    } else if (mode === 'play') {
      if (mappings[box.id]) {
        playAudio(mappings[box.id]).catch(console.error);
      } else {
        onBoxClick(box);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, draw, scaleX, scaleY, getBoxAt, mappings, onBoxClick, onBoxAdd]);

  return (
    <div className={styles.container}>
      <canvas ref={imageCanvasRef} className={styles.hiddenCanvas} />
      <div className={styles.imageWrapper}>
        <img ref={imgRef} src={imageSrc} alt="Iqra page"
          className={styles.pageImage} onLoad={handleImageLoad} draggable={false} />
        <canvas
          ref={overlayRef}
          className={styles.overlay}
          style={{ cursor: mode === 'draw' ? 'crosshair' : 'pointer' }}
          onMouseMove={onMove}
          onMouseLeave={() => setHoveredId(null)}
          onMouseDown={onDown}
          onMouseUp={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        />
      </div>
      <div className={styles.stats}>
        {mode === 'draw'
          ? 'Draw mode — drag to create a box'
          : boxes.length > 0
          ? `${boxes.length} boxes · ${Object.keys(mappings).length} with audio`
          : 'Switch to Draw mode to create boxes'}
      </div>
    </div>
  );
};
