import { useMemo, useState } from 'react';
import MatrixContainer from '@/component/MatrixContainer';
import styles from './App.module.scss';

const FEATURES = [
  { id: '01', title: 'Configurable', body: 'Density, speed, colors, characters' },
  { id: '02', title: 'Responsive', body: 'Auto-scales with ResizeObserver' },
  { id: '03', title: 'Semantic', body: 'Any HTML element type' },
  { id: '04', title: 'Forward ref', body: 'Advanced use cases' },
] as const;

const THEMES = {
  green: { rgb: '0, 255, 0', hex: '#00ff00', label: 'Classic' },
  cyan: { rgb: '0, 220, 255', hex: '#00dcff', label: 'Cyber' },
  amber: { rgb: '255, 176, 0', hex: '#ffb000', label: 'Amber' },
  red: { rgb: '255, 40, 40', hex: '#ff2828', label: 'Alert' },
} as const;

type ThemeKey = keyof typeof THEMES;

// tickMs is a delay between frames, so a *smaller* value animates faster.
// The slider below controls it inverted (dragging right = faster) so the
// UI direction matches what "speed" means to a user; tickMs stays the
// literal value the component takes.
const TICK_MS_FASTEST = 30;
const TICK_MS_SLOWEST = 200;

function App() {
  const [density, setDensity] = useState(0.35);
  const [tickMs, setTickMs] = useState(100);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<ThemeKey>('green');

  const config = useMemo(
    () => ({ columnDensity: density, tickMs, fontSize, color: THEMES[theme].rgb }),
    [density, tickMs, fontSize, theme],
  );

  const accent = THEMES[theme].hex;

  return (
    <MatrixContainer
      as="main"
      className={styles.app}
      canvasOpacity={0.25}
      config={config}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.kicker}>React component demo</p>
          <h1 className={styles.title}>Matrix Container</h1>
          <p className={styles.subtitle}>
            A drop-in canvas backdrop that turns any element into a katakana rain effect —
            tune it live below.
          </p>
          <div className={styles.divider}></div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelGroup}>
            <span className={styles.panelLabel}>Theme</span>
            <div className={styles.swatches}>
              {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.swatch} ${theme === key ? styles.swatchActive : ''}`}
                  style={{ '--swatch-color': THEMES[key].hex } as React.CSSProperties}
                  onClick={() => setTheme(key)}
                  aria-pressed={theme === key}
                >
                  {THEMES[key].label}
                </button>
              ))}
            </div>
          </div>

          <label className={styles.slider}>
            <span className={styles.panelLabel}>
              Density <em>{density.toFixed(2)}</em>
            </span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
            />
          </label>

          <label className={styles.slider}>
            <span className={styles.panelLabel}>
              Speed <em>{tickMs}ms</em>
            </span>
            <input
              type="range"
              min={TICK_MS_FASTEST}
              max={TICK_MS_SLOWEST}
              step={10}
              value={TICK_MS_FASTEST + TICK_MS_SLOWEST - tickMs}
              onChange={(e) => setTickMs(TICK_MS_FASTEST + TICK_MS_SLOWEST - Number(e.target.value))}
            />
          </label>

          <label className={styles.slider}>
            <span className={styles.panelLabel}>
              Font size <em>{fontSize}px</em>
            </span>
            <input
              type="range"
              min={12}
              max={32}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </label>
        </div>

        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <div className={styles.feature} key={feature.id}>
              <div className={styles.label}>{feature.id}</div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </MatrixContainer>
  );
}

export default App;
