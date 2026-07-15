'use client';

import React, { useEffect, useRef } from 'react';
import { MATRIX_CONFIG } from '@/lib/matrixConfig';
import type { MatrixConfig } from '@/lib/matrixConfig';
import styles from './MatrixContainer.module.scss';

interface MatrixContainerProps {
  /** Content rendered above the matrix canvas */
  children?: React.ReactNode;
  /**
   * Partial config override — merged with the default MATRIX_CONFIG at mount time.
   * Pass a stable object (defined outside the component or via useMemo) to avoid
   * unnecessary remounts if the parent re-renders.
   */
  config?: Partial<MatrixConfig>;
  /**
   * CSS opacity applied to the canvas element itself (0–1).
   * Multiplies with the per-glyph opacity values in config.
   * Useful for dimming the entire effect without touching the config.
   * Default: 1
   */
  canvasOpacity?: number;
  /** Merged onto the wrapper element alongside the internal `.wrapper` class */
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  /**
   * HTML element to render as the wrapper.
   * Use 'section', 'footer', 'aside', etc. to preserve semantic HTML.
   * Default: 'div'
   */
  as?: React.ElementType;
}

/**
 * MatrixContainer
 *
 * A wrapper element that renders the animated katakana matrix-rain canvas
 * permanently in its background. All content passed as `children` is
 * rendered on top of the canvas via a `position: relative; z-index: 1` layer.
 *
 * The canvas auto-sizes to fill the wrappglyphOpacity = 1, er via ResizeObserver and cleans up
 * on unmount (cancelAnimationFrame + ResizeObserver.disconnect).
 *
 * @see README.md for full algorithm and config documentation.
 */
const MatrixContainer = React.forwardRef<HTMLElement, MatrixContainerProps>(
  ({ children, config, canvasOpacity = 1, className, style, id, as: Tag = 'div' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Capture merged config once at mount — stored in a ref so the effect
    // doesn't need config in its dependency array (avoids restart on every
    // render when config is an inline object literal).
    const cfgRef = useRef<MatrixConfig>({ ...MATRIX_CONFIG, ...config });

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cfg = cfgRef.current;
      const FS = cfg.fontSize;

      // drop[i] = current row of the head glyph in column i (negative = above canvas)
      let drops: number[] = [];
      let rafId: number;
      let last = 0;

      const numCols = () => Math.floor(canvas.width / FS);
      const numRows = () => Math.floor(canvas.height / FS);

      const initDrops = (count: number) => {
        drops = Array.from({ length: count }, () => {
          const active = Math.random() < cfg.columnDensity;
          return active
            ? -Math.floor(Math.random() * numRows())
            : -(cfg.trailLength + Math.floor(Math.random() * numRows() * 2));
        });
      };

      const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        initDrops(numCols());
      };
      resize();

      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      const tick = (t: number) => {
        rafId = requestAnimationFrame(tick);
        if (t - last < cfg.tickMs) return;
        last = t;

        const n = numCols();
        const h = canvas.height;
        ctx.clearRect(0, 0, canvas.width, h);
        ctx.font = `${FS}px monospace`;

        for (let i = 0; i < n; i++) {
          const head = drops[i];

          // Draw trail: j=0 is the head (brightest), j=trailLength-1 is the dimmest
          for (let j = 0; j < cfg.trailLength; j++) {
            const row = head - j;
            if (row < 0 || row * FS > h) continue;
            const isHead = j === 0;
            const frac = 1 - j / cfg.trailLength;
            const opacity = isHead ? cfg.headOpacity : frac * cfg.trailOpacityMax;
            ctx.fillStyle = `rgba(${cfg.color},${opacity.toFixed(3)})`;
            const ch = cfg.chars[Math.floor(Math.random() * cfg.chars.length)];
            ctx.fillText(ch, i * FS, row * FS);
          }

          drops[i]++;

          // Once the tail has fully passed off the bottom, reset the column
          if ((head - cfg.trailLength) * FS > h) {
            const rejoin = Math.random() < cfg.columnDensity;
            drops[i] = rejoin
              ? -Math.floor(Math.random() * cfg.trailLength)
              : -(cfg.trailLength + Math.floor(Math.random() * numRows()));
          }
        }
      };

      rafId = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps — config captured once via cfgRef

    const classes = [styles.wrapper, className].filter(Boolean).join(' ');

    return (
      <Tag ref={ref as React.Ref<HTMLElement>} className={classes} style={style} id={id}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={canvasOpacity !== 1 ? { opacity: canvasOpacity } : undefined}
        />
        <div className={styles.content}>{children}</div>
      </Tag>
    );
  },
);

MatrixContainer.displayName = 'MatrixContainer';

export default MatrixContainer;
