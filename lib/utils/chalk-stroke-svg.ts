export interface ChalkStroke {
  path: Array<{ x: number; y: number }>;
  color?: string;
  width?: number;
}

export function buildChalkSvg(strokes: ChalkStroke[]): string {
  if (strokes.length > 500) throw new Error('chalk stroke cap 500');
  return strokes.map((s, i) => {
    const d = s.path.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return `<path key="${i}" d="${d}" stroke="${s.color ?? '#fff'}" stroke-width="${s.width ?? 2}" fill="none" filter="url(#chalk-rough)" />`;
  }).join('\n');
}