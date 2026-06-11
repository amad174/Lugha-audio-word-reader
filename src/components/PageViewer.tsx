import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BoundingBox, AudioMapping, AppMode } from '../types';
import { drawBoxes } from '../utils/canvas';
import { getBoxHash } from '../utils/hash';
import { playAudio } from '../utils/audio';
import {
  clientToDisplay,
  displayRectToImageBox,
  getPageMetrics,
  hitTestBox,
  PageMetrics,
} from '../utils/pageCoords';
import { useCoarsePointer } from '../hooks/useMediaQuery';
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
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const EMPTY_DRAW: DrawState = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };

function syncOverlayCanvas(overlay: HTMLCanvasElement, metrics: PageMetrics) {
  const w = Math.round(metrics.displayWidth);
  const h = Math.round(metrics.displayHeight);
  if (overlay.width !== w || overlay.height !== h) {
    overlay.width = w;
    overlay.height = h;
  }
}

export const PageViewer: React.FC<Props> = ({
  imageSrc, mappings, mode, boxes, isAdmin,
  onBoxClick, onBoxAdd, onBoxDelete, onWordHeard, onSwipe,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<PageMetrics | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PageMetrics | null>(null);
  const [draw, setDraw] = useState<DrawState>(EMPTY_DRAW);
  const [imageReady, setImageReady] = useState(false);
  const isCoarsePointer = useCoarsePointer();
  const tapSlop = isCoarsePointer ? 14 : 4;
  const minDrawSize = isCoarsePointer ? 12 : 8;

  const refreshLayout = useCallback(() => {
    const img = imgRef.current;
    const overlay = overlayRef.current;
    const next = getPageMetrics(img);
    metricsRef.current = next;
    setMetrics(next);
    if (next && overlay) syncOverlayCanvas(overlay, next);
  }, []);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const c = imageCanvasRef.current!;
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    try {
      c.getContext('2d')!.drawImage(img, 0, 0);
    } catch {
      // Cross-origin images cannot be copied to canvas; hash fallback still works.
    }
    setImageReady(true);
    requestAnimationFrame(() => refreshLayout());
  }, [refreshLayout]);

  useEffect(() => {
    setImageReady(false);
    setMetrics(null);
    metricsRef.current = null;
  }, [imageSrc]);

  useEffect(() => {
    if (!imageReady) return;
    refreshLayout();
    window.addEventListener('resize', refreshLayout);
    const ro = new ResizeObserver(refreshLayout);
    if (imgRef.current) ro.observe(imgRef.current);
    return () => {
      window.removeEventListener('resize', refreshLayout);
      ro.disconnect();
    };
  }, [imageReady, refreshLayout]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const m = metrics;
    if (!overlay || !m) return;

    const preview = draw.active
      ? {
          x: Math.min(draw.startX, draw.currentX),
          y: Math.min(draw.startY, draw.currentY),
          w: Math.abs(draw.currentX - draw.startX),
          h: Math.abs(draw.currentY - draw.startY),
        }
      : null;

    drawBoxes(overlay, boxes, mappings, hoveredId, selectedId, m.scaleX, m.scaleY, preview, mode === 'delete');
  }, [boxes, mappings, hoveredId, selectedId, metrics, draw, mode]);

  const finishDraw = useCallback((state: DrawState) => {
    const img = imgRef.current;
    const m = metricsRef.current;
    if (!img || !m) return;

    const pw = Math.abs(state.currentX - state.startX);
    const ph = Math.abs(state.currentY - state.startY);
    if (pw < minDrawSize || ph < minDrawSize) return;

    const x0 = Math.min(state.startX, state.currentX);
    const y0 = Math.min(state.startY, state.currentY);
    const { x, y, w, h } = displayRectToImageBox(x0, y0, pw, ph, m);

    let id: string;
    try {
      id = imageCanvasRef.current
        ? getBoxHash(imageCanvasRef.current, x, y, w, h)
        : `${x}-${y}-${w}-${h}`;
    } catch {
      id = `${x}-${y}-${w}-${h}`;
    }

    const newBox: BoundingBox = { x, y, w, h, id };
    setSelectedId(id);
    onBoxAdd(newBox);
  }, [onBoxAdd, minDrawSize]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const img = imgRef.current;
    const m = metricsRef.current;
    if (!img || !m) return;

    if (e.pointerType === 'touch') {
      touchStartRef.current = { x: e.clientX, y: e.clientY };
    }

    const { px, py } = clientToDisplay(e.clientX, e.clientY, img);

    if (mode === 'draw') {
      e.preventDefault();
      pointerIdRef.current = e.pointerId;
      layerRef.current?.setPointerCapture(e.pointerId);
      setDraw({ active: true, startX: px, startY: py, currentX: px, currentY: py });
      return;
    }

    pointerIdRef.current = e.pointerId;
    layerRef.current?.setPointerCapture(e.pointerId);
  }, [mode]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const img = imgRef.current;
    const m = metricsRef.current;
    if (!img || !m) return;

    const { px, py } = clientToDisplay(e.clientX, e.clientY, img);

    if (mode === 'draw' && draw.active) {
      e.preventDefault();
      setDraw(prev => ({ ...prev, currentX: px, currentY: py }));
      return;
    }

    const box = hitTestBox(px, py, boxes, m, tapSlop);
    setHoveredId(box?.id ?? null);
  }, [mode, draw.active, boxes, tapSlop]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const img = imgRef.current;
    const m = metricsRef.current;
    if (!img || !m) return;

    if (pointerIdRef.current === e.pointerId) {
      layerRef.current?.releasePointerCapture(e.pointerId);
      pointerIdRef.current = null;
    }

    if (mode !== 'draw' && e.pointerType === 'touch' && touchStartRef.current) {
      const dx = e.clientX - touchStartRef.current.x;
      const dy = e.clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        onSwipe?.(dx < 0 ? 'left' : 'right');
        return;
      }
    }
    touchStartRef.current = null;

    if (mode === 'draw' && draw.active) {
      e.preventDefault();
      const state = draw;
      setDraw(EMPTY_DRAW);
      finishDraw(state);
      return;
    }

    const { px, py } = clientToDisplay(e.clientX, e.clientY, img);
    const box = hitTestBox(px, py, boxes, m, tapSlop);
    if (!box) return;

    if (mode === 'delete') {
      onBoxDelete(box.id);
      setHoveredId(null);
      return;
    }

    setSelectedId(box.id);

    if (mode === 'assign') {
      onBoxClick(box);
    } else if (mappings[box.id]) {
      playAudio(mappings[box.id])
        .then(() => onWordHeard?.(box.id))
        .catch(console.error);
    } else if (isAdmin) {
      onBoxClick(box);
    }
  }, [mode, draw, boxes, mappings, onBoxClick, onBoxDelete, isAdmin, onWordHeard, onSwipe, finishDraw, tapSlop]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current === e.pointerId) {
      layerRef.current?.releasePointerCapture(e.pointerId);
      pointerIdRef.current = null;
    }
    setDraw(EMPTY_DRAW);
    touchStartRef.current = null;
  }, []);

  const cursor =
    mode === 'draw' ? 'crosshair' :
    mode === 'delete' ? 'not-allowed' :
    'pointer';

  const interactionModeClass =
    mode === 'draw' || mode === 'delete' ? styles.interactionDraw : styles.interactionPan;

  return (
    <div className={styles.container}>
      <canvas ref={imageCanvasRef} className={styles.hiddenCanvas} />
      <div className={styles.stage}>
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Lugha page"
          className={styles.pageImage}
          onLoad={handleImageLoad}
          draggable={false}
        />
        <canvas ref={overlayRef} className={styles.overlay} aria-hidden />
        <div
          ref={layerRef}
          className={`${styles.interactionLayer} ${interactionModeClass} ${mode === 'draw' ? styles.overlayDraw : ''}`}
          style={{ cursor }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={() => {
            if (!draw.active) setHoveredId(null);
          }}
        />
      </div>
      <div className={styles.stats}>
        {mode === 'draw' ? 'Drag to draw a box around a letter or word'
          : mode === 'delete' ? 'Tap a box to delete it'
          : mode === 'assign' ? 'Tap a box to assign audio'
          : boxes.length > 0
          ? `${boxes.length} boxes · ${boxes.filter(b => mappings[b.id]).length} with audio · tap to listen`
          : isAdmin ? 'Switch to Draw mode to add boxes' : 'No boxes yet — ask your teacher to set up this page'}
      </div>
    </div>
  );
};
