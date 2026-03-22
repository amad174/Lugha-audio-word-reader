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
  isAdmin: boolean;
  onBoxClick: (box: BoundingBox) => void;
  onBoxAdd: (box: BoundingBox) => void;
  onBoxDelete: (id: string) => void;
  onWordHeard?: (boxId: string) => void;
  onSwipe?: (dir: 'left' | 'right') => void;
}

interface DrawState {
  active: boolean;
  startX: number; startY: number;
  currentX: number; currentY: number;
}

const EMPTY_DRAW: DrawState = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };

export const PageViewer: React.FC<Props> = ({
  imageSrc, mappings, mode, boxes, isAdmin,
  onBoxClick, onBoxAdd, onBoxDelete, onWordHeard, onSwipe,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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
    const c = imageCanvasRef.current!;
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    const ro = new ResizeObserver(updateScale);
    if (imgRef.current) ro.observe(imgRef.current);
    return () => { window.removeEventListener('resize', updateScale); ro.disconnect(); };
  }, [updateScale]);

  useEffect(() => {
    if (!overlayRef.current) return;
    const preview = draw.active
      ? { x: Math.min(draw.startX, draw.currentX), y: Math.min(draw.startY, draw.currentY),
          w: Math.abs(draw.currentX - draw.startX), h: Math.abs(draw.currentY - draw.startY) }
      : null;
    drawBoxes(overlayRef.current, boxes, mappings, hoveredId, selectedId, scaleX, scaleY, preview, mode === 'delete');
  }, [boxes, mappings, hoveredId, selectedId, scaleX, scaleY, draw, mode]);

  const toXY = useCallback((clientX: number, clientY: number) => {
    const r = overlayRef.current?.getBoundingClientRect();
    if (!r) return { px: 0, py: 0 };
    return { px: clientX - r.left, py: clientY - r.top };
  }, []);

  const getBoxAt = useCallback((clientX: number, clientY: number): BoundingBox | null => {
    const { px, py } = toXY(clientX, clientY);
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (px >= b.x * scaleX && px <= (b.x + b.w) * scaleX &&
          py >= b.y * scaleY && py <= (b.y + b.h) * scaleY) return b;
    }
    return null;
  }, [boxes, scaleX, scaleY, toXY]);

  const xy = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      const t = e.touches[0] ?? (e as React.TouchEvent).changedTouches[0];
      return { clientX: t.clientX, clientY: t.clientY };
    }
    return { clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY };
  };

  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Record touch start for swipe detection
    if ('touches' in e && e.touches[0]) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (mode !== 'draw') return;
    const { clientX, clientY } = xy(e);
    const { px, py } = toXY(clientX, clientY);
    setDraw({ active: true, startX: px, startY: py, currentX: px, currentY: py });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, toXY]);

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const { clientX, clientY } = xy(e);
    if (mode === 'draw' && draw.active) {
      const { px, py } = toXY(clientX, clientY);
      setDraw(prev => ({ ...prev, currentX: px, currentY: py }));
    } else {
      setHoveredId(getBoxAt(clientX, clientY)?.id ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, draw.active, toXY, getBoxAt]);

  const onUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Detect horizontal swipe on touch (non-draw modes only)
    if (mode !== 'draw' && 'changedTouches' in e && e.changedTouches[0] && touchStartRef.current) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        onSwipe?.(dx < 0 ? 'left' : 'right');
        return;
      }
    }
    touchStartRef.current = null;

    // Finish drawing a new box
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

    const { clientX, clientY } = xy(e);
    const box = getBoxAt(clientX, clientY);
    if (!box) return;

    if (mode === 'delete') {
      onBoxDelete(box.id);
      setHoveredId(null);
      return;
    }

    setSelectedId(box.id);

    if (mode === 'assign') {
      onBoxClick(box);
    } else {
      // play mode
      if (mappings[box.id]) {
        playAudio(mappings[box.id]).catch(console.error);
        onWordHeard?.(box.id);
      } else if (isAdmin) {
        onBoxClick(box);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, draw, scaleX, scaleY, getBoxAt, mappings, onBoxClick, onBoxAdd, onBoxDelete, isAdmin, onWordHeard, onSwipe]);

  const cursor =
    mode === 'draw' ? 'crosshair' :
    mode === 'delete' ? 'not-allowed' :
    'pointer';

  return (
    <div className={styles.container}>
      <canvas ref={imageCanvasRef} className={styles.hiddenCanvas} />
      <div className={styles.imageWrapper}>
        <img ref={imgRef} src={imageSrc} alt="Iqra page"
          className={styles.pageImage} onLoad={handleImageLoad} draggable={false} />
        <canvas
          ref={overlayRef}
          className={`${styles.overlay} ${mode === 'draw' ? styles.overlayDraw : ''}`}
          style={{ cursor }}
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
        {mode === 'draw' ? 'Drag to draw a box around a letter or word'
          : mode === 'delete' ? 'Tap a box to delete it'
          : mode === 'assign' ? 'Tap a box to assign audio'
          : boxes.length > 0
          ? `${boxes.length} boxes · ${Object.keys(mappings).length} with audio · tap to listen`
          : isAdmin ? 'Switch to Draw mode to add boxes' : 'No boxes yet — ask your teacher to set up this page'}
      </div>
    </div>
  );
};
