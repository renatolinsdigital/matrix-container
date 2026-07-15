import MatrixContainer from '@/component/MatrixContainer';
import styles from './App.module.scss';

function App() {
  return (
    <MatrixContainer
      as="main"
      className={styles.app}
      canvasOpacity={0.25}
      config={{
        columnDensity: 0.35,
        tickMs: 100,
        fontSize: 18,
      }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>MATRIX CONTAINER</h1>
          <div className={styles.divider}></div>
        </div>

        <div className={styles.grid}>
          <div className={styles.feature}>
            <div className={styles.label}>01</div>
            <h3>CONFIGURABLE</h3>
            <p>Density, speed, colors, characters</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.label}>02</div>
            <h3>RESPONSIVE</h3>
            <p>Auto-scales with ResizeObserver</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.label}>03</div>
            <h3>SEMANTIC</h3>
            <p>Any HTML element type</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.label}>04</div>
            <h3>FORWARD REF</h3>
            <p>Advanced use cases</p>
          </div>
        </div>
      </div>
    </MatrixContainer>
  );
}

export default App;
