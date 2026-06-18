import { useCallback, useRef, useState } from 'react';
import styles from './BeforeAfter.module.css';

interface Props {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

/**
 * Draggable before/after comparison. The slider position is transient
 * presentational state, so it lives locally (not in the app store).
 */
export function BeforeAfter({ beforeSrc, afterSrc, beforeLabel = 'Original', afterLabel = 'Staged' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // percent revealed of "before"
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) updateFromClientX(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className={styles.wrap}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* base: staged */}
      <img className={styles.img} src={afterSrc} alt={afterLabel} draggable={false} />
      <span className={`${styles.tag} ${styles.tagRight}`}>{afterLabel}</span>

      {/* overlay: original, clipped to the left of the handle (clip-path keeps it full-size) */}
      <div className={styles.beforeClip} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img className={styles.img} src={beforeSrc} alt={beforeLabel} draggable={false} />
      </div>
      <span className={`${styles.tag} ${styles.tagLeft}`}>{beforeLabel}</span>

      {/* handle */}
      <div className={styles.handle} style={{ left: `${pos}%` }}>
        <div className={styles.handleLine} />
        <div className={styles.handleGrip}>⇆</div>
      </div>
    </div>
  );
}
