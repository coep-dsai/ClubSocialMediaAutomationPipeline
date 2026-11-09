// Timing: everything on screen is placed on the narration's clock.
//   data/lines.json  { duration, lines: [{ i, text, start, end }] }
//   data/words.json  [{ w, line, s, e }]
export const T = { dur: 0, lines: [], words: [] };
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']+/g, '');

export async function loadTiming() {
  const get = async (f) => {
    const r = await fetch(f, { cache: 'no-store' });
    if (!r.ok) throw new Error(\missing \: run audio synthesis first\);
    return r.json();
  };
  const lines = await get('data/lines.json'), words = await get('data/words.json');
  T.lines = Array.isArray(lines.lines) ? lines.lines : Object.values(lines.lines || {});
  T.words = words || [];
  T.dur = lines.duration || (T.lines.length ? T.lines[T.lines.length - 1].end : 0);
  return T;
}

export const L = (i) => {
  if (!T.lines || T.lines.length === 0) return 0;
  const idx = Math.min(Math.max(0, i), T.lines.length - 1);
  return T.lines[idx] ? T.lines[idx].start : 0;
};

export const Le = (i) => {
  if (!T.lines || T.lines.length === 0) return T.dur || 1;
  const idx = Math.min(Math.max(0, i), T.lines.length - 1);
  return T.lines[idx] ? T.lines[idx].end : (T.dur || 1);
};

export function Wd(word, line, which = 's') {
  const n = norm(word);
  const hit = T.words.find((w) => (line == null || w.line === line) && norm(w.w).startsWith(n));
  if (hit) return hit[which];
  if (line != null && T.lines && T.lines[line]) {
    const s = T.lines[line].start, e = T.lines[line].end;
    return which === 'e' ? e : s + (e - s) * 0.4;
  }
  return 0.5;
}

export const lineWords = (i) => (T.words || []).filter((w) => w.line === i);
