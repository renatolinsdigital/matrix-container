import { useEffect, useMemo, useRef, useState } from 'react';
import MatrixContainer from '@/component/MatrixContainer';
import styles from './App.module.scss';

type IconProps = { className?: string };

const ConfigIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
  </svg>
);

const ResponsiveIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 9 4 4 9 4" />
    <polyline points="20 9 20 4 15 4" />
    <polyline points="4 15 4 20 9 20" />
    <polyline points="20 15 20 20 15 20" />
  </svg>
);

const SemanticIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="8 6 3 12 8 18" />
    <polyline points="16 6 21 12 16 18" />
  </svg>
);

const RefIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 15l6-6" />
    <path d="M11 6l1-1a3.5 3.5 0 0 1 5 5l-1 1" />
    <path d="M13 18l-1 1a3.5 3.5 0 0 1-5-5l1-1" />
  </svg>
);

const FEATURES = [
  { id: '01', title: 'Configurable', body: 'Density, speed, colors, characters', icon: ConfigIcon },
  { id: '02', title: 'Responsive', body: 'Auto-scales with ResizeObserver', icon: ResponsiveIcon },
  { id: '03', title: 'Semantic', body: 'Any HTML element type', icon: SemanticIcon },
  { id: '04', title: 'Forward ref', body: 'Advanced use cases', icon: RefIcon },
] as const;

const BADGES = ['React 18', 'TypeScript', 'Canvas 2D', 'Zero-dep'] as const;

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
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const config = useMemo(
    () => ({ columnDensity: density, tickMs, fontSize, color: THEMES[theme].rgb }),
    [density, tickMs, fontSize, theme],
  );

  const accent = THEMES[theme].hex;

  const configCode = useMemo(
    () =>
      `<MatrixContainer\n  config={{\n    columnDensity: ${density.toFixed(2)},\n    tickMs: ${tickMs},\n    fontSize: ${fontSize},\n    color: '${THEMES[theme].rgb}',\n  }}\n>\n  <YourContent />\n</MatrixContainer>`,
    [density, tickMs, fontSize, theme],
  );

  useEffect(() => () => clearTimeout(copyTimeoutRef.current), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(configCode);
      setCopied(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (permissions/insecure context) — button stays as-is.
    }
  };

  return (
    <MatrixContainer
      as="main"
      className={styles.app}
      canvasOpacity={0.25}
      config={config}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <div className={styles.scanlines} aria-hidden="true" />

      <div className={styles.container}>
        <nav className={styles.nav}>
          <div className={styles.brand}>
            <span className={styles.brandCursor} aria-hidden="true" />
            MatrixContainer
          </div>
          <div className={styles.navBadges}>
            {BADGES.map((badge) => (
              <span className={styles.navBadge} key={badge}>
                {badge}
              </span>
            ))}
          </div>
        </nav>

        <div className={styles.header}>
          <span className={styles.pill}>
            <span className={styles.pillDot} aria-hidden="true" />
            Live interactive demo
          </span>
          <h1 className={styles.title}>
            <span className={styles.titleGhost}>Matrix</span>
            <span className={styles.titleAccent}>Container</span>
          </h1>
          <p className={styles.subtitle}>
            A drop-in canvas backdrop that turns any element into a katakana rain effect.
          </p>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelBar}>
            <div className={styles.dots} aria-hidden="true">
              <span className={styles.dotRed} />
              <span className={styles.dotYellow} />
              <span className={styles.dotGreen} />
            </div>
            <span className={styles.panelFile}>matrix.config.ts</span>
          </div>

          <div className={styles.panelBody}>
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

            <div className={styles.panelSliders}>
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
          </div>
        </div>

        <div className={styles.snippet}>
          <div className={styles.snippetHeader}>
            <span className={styles.snippetLabel}>Usage — updates live with the panel above</span>
            <button type="button" className={styles.copyBtn} onClick={handleCopy}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <pre className={styles.code}>
            <code>
              <span className={styles.tokTag}>&lt;MatrixContainer</span>
              {'\n  '}
              <span className={styles.tokAttr}>config</span>
              <span className={styles.tokPunct}>{'={{'}</span>
              {'\n    '}
              <span className={styles.tokKey}>columnDensity</span>
              <span className={styles.tokPunct}>: </span>
              <span className={styles.tokNum}>{density.toFixed(2)}</span>
              <span className={styles.tokPunct}>,</span>
              {'\n    '}
              <span className={styles.tokKey}>tickMs</span>
              <span className={styles.tokPunct}>: </span>
              <span className={styles.tokNum}>{tickMs}</span>
              <span className={styles.tokPunct}>,</span>
              {'\n    '}
              <span className={styles.tokKey}>fontSize</span>
              <span className={styles.tokPunct}>: </span>
              <span className={styles.tokNum}>{fontSize}</span>
              <span className={styles.tokPunct}>,</span>
              {'\n    '}
              <span className={styles.tokKey}>color</span>
              <span className={styles.tokPunct}>: </span>
              <span className={styles.tokStr}>'{THEMES[theme].rgb}'</span>
              <span className={styles.tokPunct}>,</span>
              {'\n  '}
              <span className={styles.tokPunct}>{'}}'}</span>
              {'\n'}
              <span className={styles.tokTag}>&gt;</span>
              {'\n  '}
              <span className={styles.tokTag}>&lt;YourContent /&gt;</span>
              {'\n'}
              <span className={styles.tokTag}>&lt;/MatrixContainer&gt;</span>
            </code>
          </pre>
        </div>

        <div className={styles.grid}>
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div className={styles.feature} key={feature.id}>
                <div className={styles.featureTop}>
                  <span className={styles.featureIcon}>
                    <Icon />
                  </span>
                  <div className={styles.label}>{feature.id}</div>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            );
          })}
        </div>

        <footer className={styles.footer}>
          <span>Created by <a href="https://www.linkedin.com/in/renatolinsdigital" target="_blank" rel="noopener noreferrer">Renato Lins</a>.</span>
        </footer>
      </div>
    </MatrixContainer>
  );
}

export default App;
