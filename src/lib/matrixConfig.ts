export interface MatrixConfig {
  /** Font size in pixels */
  fontSize: number;
  /** Probability (0–1) that a column is "active" and generates rain */
  columnDensity: number;
  /** Number of glyphs in the trail */
  trailLength: number;
  /** Milliseconds per animation tick */
  tickMs: number;
  /** RGBA color values (without alpha) for the glyphs */
  color: string;
  /** Opacity of the head glyph (0–1) */
  headOpacity: number;
  /** Maximum opacity for trail glyphs */
  trailOpacityMax: number;
  /** Array of characters to display */
  chars: string[];
}

export const MATRIX_CONFIG: MatrixConfig = {
  fontSize: 20,
  columnDensity: 0.5,
  trailLength: 10,
  tickMs: 50,
  color: '0, 255, 0',
  headOpacity: 1,
  trailOpacityMax: 0.8,
  chars: [
    'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ', 'シ', 'ス', 'セ', 'ソ',
    'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
    'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ル', 'レ', 'ロ', 'ワ', 'ン',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
  ],
};
