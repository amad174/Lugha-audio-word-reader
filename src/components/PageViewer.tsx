import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BoundingBox, AudioMapping } from '../types';
import { detectBoxes, drawBoxes, isOpenCVReady } from '../utils/opencv';
import { playAudio } from '../utils/audio';
import styles from './PageViewer.module.css';

interface Props {
  imageSrc: string;
  mappings: AudioMapping;
  onBoxClick: (box: BoundingBox) => void;
  isAssignMode: boolean;
}

export const PageViewer: React.FC<Props> = ({
  imageSrc,
  mappings,
  onBoxClick,
  isAssignMode,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });

  // Draw image onto offscreen canvas for OpenCV
  const renderImageToCanvas = useCallback(
    (img: HTMLImageElement): HTMLCanvasElement => {
      const canvas = imageCanvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      return canvas;
    },
    []
  );

  const updateScale = useCallback(() => {
    if (!imgRef.current || imgNatural.w === 0) return;
    const displayed = imgRef.current.getBoundingClientRect();
    setScaleX(displayed.width / imgNatural.w);
    setScaleY(displayed.height / imgNatural.h);

    if (overlayRef.current) {
      overlayRef.current.width = displayed.width;
      overlayRef.current.height = displayed.height;
    }
  }, [imgNatural]);

  // Detect boxes when image loads
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    if (!isOpenCVReady()) return;
    setDetecting(true);
    try {
      const canvas = renderImageToCanvas(img);
      const detected = detectBoxes(canvas, { minArea: 80, maxArea: 60000, padding: 3 });
      setBoxes(detected);
    } catch (e) {
      console.error('Detection failed', e);
    } finally {
      setDetecting(false);
    }
  }, [renderImageToCanvas]);

  // Redraw overlay whenever boxes/mappings/hover/scale change
  useEffect(() => {
    if (!overlayRef.current || boxes.length === 0) return;
    updateScale();
    drawBoxes(overlayRef.current, boxes, mappings, hoveredId, selectedId, scaleX, scaleY);
  }, [boxes, mappings, hoveredId, selectedId, scaleX, scaleY, updateScale]);

  useEffect(() => {
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  const getBoxAtPoint = useCallback(
    (clientX: number, clientY: number): BoundingBox | null => {
      if (!overlayRef.current) return null;
      const rect = overlayRef.current.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      for (const box of boxes) {
        if (
          px >= box.x * scaleX &&
          px <= (box.x + box.w) * scaleX &&
          py >= box.y * scaleY &&
          py <= (box.y + box.h) * scaleY
        ) {
          return box;
        }
      }
      return null;
    },
    [boxes, scaleX, scaleY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const box = getBoxAtPoint(e.clientX, e.clientY);
      setHoveredId(box?.id ?? null);
    },
    [getBoxAtPoint]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const box = getBoxAtPoint(clientX, clientY);
      if (!box) return;

      setSelectedId(box.id);

      if (isAssignMode) {
        onBoxClick(box);
      } else {
        // Play mode
        if (mappings[box.id]) {
          playAudio(mappings[box.id]).catch(console.error);
        } else {
          // No audio yet – ask to assign
          onBoxClick(box);
        }
      }
    },
    [getBoxAtPoint, isAssignMode, mappings, onBoxClick]
  );

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Hidden canvas for OpenCV processing */}
      <canvas ref={imageCanvasRef} className={styles.hiddenCanvas} />

      <div className={styles.imageWrapper}>
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Iqra page"
          className={styles.pageImage}
          onLoad={handleImageLoad}
          draggable={false}
        />
        <canvas
          ref={overlayRef}
          className={styles.overlay}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredId(null)}
          onClick={handleClick}
          onTouchEnd={handleClick}
        />
      </div>

      {detecting && (
        <div className={styles.detecting}>Detecting letters…</div>
      )}

      <div className={styles.stats}>
        {boxes.length > 0 && (
          <span>{boxes.length} regions detected · {Object.keys(mappings).length} mapped</span>
        )}
      </div>
    </div>
  );
};
