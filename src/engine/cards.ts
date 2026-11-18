export type Card = number;
export const RANK_CHARS = '23456789TJQKA';
export const SUIT_CHARS = 'shdc';
export const rankOf = (c: Card): number => (c >> 2) + 2;
export const suitOf = (c: Card): number => c & 3;
export const cardStr = (c: Card): string => RANK_CHARS[rankOf(c) - 2] + SUIT_CHARS[suitOf(c)];
export function parseCard(s: string): Card {
  const r = RANK_CHARS.indexOf(s[0].toUpperCase());
  const su = SUIT_CHARS.indexOf(s[1].toLowerCase());
  if (r < 0 || su < 0 || s.length !== 2) throw new Error(`Carta invalida: ${s}`);
  return r * 4 + su;
}
export function parseCards(s: string): Card[] { return s.split(/[\s,]+/).filter(Boolean).map(parseCard); }
export const FULL_DECK: Card[] = Array.from({ length: 52 }, (_, i) => i);
export function availableDeck(dead: Iterable<Card>): Card[] { const d = new Set(dead); return FULL_DECK.filter((c) => !d.has(c)); }
export const CATEGORY_NAMES = ['Carta alta','Pareja','Doble pareja','Trio','Escalera','Color','Full house','Poker','Escalera de color'] as const;
export const categoryOfScore = (score: number): number => Math.floor(score / 15 ** 5);
export function evaluate5(cs: Card[]): number {
  const rs = cs.map(rankOf).sort((a, b) => b - a);
  const flush = cs.every((c) => suitOf(c) === suitOf(cs[0]));
  const uniq = [...new Set(rs)];
  let straightHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
    else if (uniq[0] === 14 && uniq[1] === 5 && uniq[2] === 4 && uniq[3] === 3 && uniq[4] === 2) straightHigh = 5;
  }
  const counts = new Map<number, number>();
  for (const r of rs) counts.set(r, (counts.get(r) ?? 0) + 1);
  const g = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  let cat: number; let kicks: number[];
  if (straightHigh > 0 && flush) { cat = 8; kicks = [straightHigh]; }
  else if (g[0][1] === 4) { cat = 7; kicks = [g[0][0], g[1][0]]; }
  else if (g[0][1] === 3 && g[1][1] === 2) { cat = 6; kicks = [g[0][0], g[1][0]]; }
  else if (flush) { cat = 5; kicks = rs; }
  else if (straightHigh > 0) { cat = 4; kicks = [straightHigh]; }
  else if (g[0][1] === 3) { cat = 3; kicks = [g[0][0], g[1][0], g[2][0]]; }
  else if (g[0][1] === 2 && g[1][1] === 2) { cat = 2; kicks = [g[0][0], g[1][0], g[2][0]]; }
  else if (g[0][1] === 2) { cat = 1; kicks = [g[0][0], g[1][0], g[2][0], g[3][0]]; }
  else { cat = 0; kicks = rs; }
  let score = cat;
  for (let i = 0; i < 5; i++) score = score * 15 + (kicks[i] ?? 0);
  return score;
}
export interface EvalResult { score: number; category: number; name: string; best: Card[] }
export function evaluate7CardHand(seven: Card[]): EvalResult {
  if (seven.length !== 7) throw new Error('evaluate7CardHand requiere 7 cartas');
  let bestScore = -1; let best: Card[] = [];
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 4; b++) for (let c = b + 1; c < 5; c++)
    for (let d = c + 1; d < 6; d++) for (let e = d + 1; e < 7; e++) {
      const five = [seven[a], seven[b], seven[c], seven[d], seven[e]];
      const s = evaluate5(five);
      if (s > bestScore) { bestScore = s; best = five; }
    }
  const category = categoryOfScore(bestScore);
  return { score: bestScore, category, name: CATEGORY_NAMES[category], best };
}
export function hand169Label(a: Card, b: Card): string {
  let r1 = rankOf(a), r2 = rankOf(b);
  if (r2 > r1) { const t = r1; r1 = r2; r2 = t; const tc = a; a = b; b = tc; }
  const c1 = RANK_CHARS[r1 - 2], c2 = RANK_CHARS[r2 - 2];
  if (r1 === r2) return c1 + c2;
  return c1 + c2 + (suitOf(a) === suitOf(b) ? 's' : 'o');
}
export const ALL_169: string[] = (() => {
  const out: string[] = [];
  for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) {
    if (i === j) out.push(RANK_CHARS[i] + RANK_CHARS[j]);
    else if (i > j) out.push(RANK_CHARS[i] + RANK_CHARS[j] + 's');
    else out.push(RANK_CHARS[j] + RANK_CHARS[i] + 'o');
  }
  return out;
})();
export function combosForLabels(labels: readonly string[], dead: ReadonlySet<Card>): [Card, Card][] {
  const out: [Card, Card][] = [];
  for (const label of labels) {
    const r1 = RANK_CHARS.indexOf(label[0]), r2 = RANK_CHARS.indexOf(label[1]);
    if (r1 < 0 || r2 < 0) continue;
    if (r1 === r2) {
      for (let s1 = 0; s1 < 4; s1++) for (let s2 = s1 + 1; s2 < 4; s2++) {
        const a = r1 * 4 + s1, b = r1 * 4 + s2;
        if (!dead.has(a) && !dead.has(b)) out.push([a, b]);
      }
    } else {
      const suited = label.endsWith('s');
      for (let s1 = 0; s1 < 4; s1++) for (let s2 = 0; s2 < 4; s2++) {
        if (suited ? s1 !== s2 : s1 === s2) continue;
        const a = r1 * 4 + s1, b = r2 * 4 + s2;
        if (!dead.has(a) && !dead.has(b)) out.push([a, b]);
      }
    }
  }
  return out;
}
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
export function drawCards(rng: () => number, pool: readonly Card[], k: number): Card[] {
  const p = [...pool];
  for (let i = 0; i < k; i++) { const j = i + Math.floor(rng() * (p.length - i)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  return p.slice(0, k);
}
export interface BoardTexture { paired: boolean; monotone: boolean; twoTone: boolean; rainbow: boolean; high: number; connected: boolean }
export function boardTexture(board: readonly Card[]): BoardTexture {
  const rs = board.map(rankOf).sort((a, b) => b - a);
  const suits = new Set(board.map(suitOf));
  const paired = new Set(rs).size < rs.length;
  const sorted = [...rs].sort((a, b) => a - b);
  const connected = sorted.length >= 3 && sorted[sorted.length - 1] - sorted[0] <= 4;
  return { paired, monotone: suits.size === 1 && board.length >= 3, twoTone: suits.size === 2, rainbow: suits.size >= 3, high: rs[0] ?? 0, connected };
}
