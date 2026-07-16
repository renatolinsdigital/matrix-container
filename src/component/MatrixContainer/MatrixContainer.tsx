'use client';

import React, { useEffect, useRef } from 'react';
import { MATRIX_CONFIG } from '@/lib/matrixConfig';
import type { MatrixConfig } from '@/lib/matrixConfig';
import styles from './MatrixContainer.module.scss';

interface MatrixContainerProps {
  /** Content rendered above the matrix canvas */
  children?: React.ReactNode;
  /**
   * Partial config override — merged with the default MATRIX_CONFIG at mount,
   * then kept live: later changes are applied to the running animation in
   * place, without tearing down the canvas or ResizeObserver. Pass a stable
   * object (defined outside the component or via useMemo) so unrelated parent
   * re-renders don't trigger redundant merges.
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
 * The canvas auto-sizes to fill the wrapper via ResizeObserver and cleans up
 * on unmount (cancelAnimationFrame + ResizeObserver.disconnect).
 *
 * @see README.md for full algorithm and config documentation.
 */
const MatrixContainer = React.forwardRef<HTMLElement, MatrixContainerProps>(
  ({ children, config, canvasOpacity = 1, className, style, id, as: Tag = 'div' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Merged once at mount, then mutated in place (see the effect below) —
    // the tick loop closes over this same object, so property updates are
    // picked up on the next frame with no restart.
    const cfgRef = useRef<MatrixConfig>({ ...MATRIX_CONFIG, ...config });

    // Re-measures the canvas and re-rolls the drops array on demand.
    // Populated by the setup effect; called by the live-config effect below.
    const regridRef = useRef<(immediate?: boolean) => void>();

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cfg = cfgRef.current;

      // drop[i] = current row of the head glyph in column i (negative = above canvas)
      let drops: number[] = [];
      let rafId: number;
      let last = 0;

      const numCols = () => Math.floor(canvas.width / cfg.fontSize);
      const numRows = () => Math.floor(canvas.height / cfg.fontSize);

      // `immediate` scatters active columns across the whole visible height
      // instead of starting them above the canvas. Mount/resize use the
      // gradual entrance (rain "arrives" from the top); a config-driven
      // re-roll uses `immediate` so a density/fontSize change reads on
      // screen right away instead of trickling in over the next couple
      // of seconds.
      const initDrops = (count: number, immediate = false) => {
        drops = Array.from({ length: count }, () => {
          const active = Math.random() < cfg.columnDensity;
          if (!active) return -(cfg.trailLength + Math.floor(Math.random() * numRows() * 2));
          return immediate ? Math.floor(Math.random() * numRows()) : -Math.floor(Math.random() * numRows());
        });
      };

      const resize = (immediate = false) => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        initDrops(numCols(), immediate);
      };
      resize();
      regridRef.current = resize;

      const ro = new ResizeObserver(() => resize());
      ro.observe(canvas);

      const tick = (t: number) => {
        rafId = requestAnimationFrame(tick);
        if (t - last < cfg.tickMs) return;
        last = t;

        const FS = cfg.fontSize;
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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps — cfgRef is mutated by the effect below, not replaced

    // Apply config updates to the running animation instead of restarting it.
    // Skipped on the mount render (cfgRef already holds these values).
    const isMountRef = useRef(true);
    useEffect(() => {
      if (isMountRef.current) {
        isMountRef.current = false;
        return;
      }
      if (!config) return;

      // fontSize changes the column/row grid; columnDensity decides which
      // columns are active. Both only take visible effect once drops are
      // re-rolled, and an inactive column can sit off-screen for a long
      // time before naturally cycling back — so force a re-roll rather
      // than waiting for one.
      const needsRegrid =
        (config.fontSize !== undefined && config.fontSize !== cfgRef.current.fontSize) ||
        (config.columnDensity !== undefined && config.columnDensity !== cfgRef.current.columnDensity);

      Object.assign(cfgRef.current, config);
      if (needsRegrid) regridRef.current?.(true);
    }, [config]);

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
