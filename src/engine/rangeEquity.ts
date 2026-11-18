import type { Card } from './cards.ts';
import { parseCards, parseCard, availableDeck, drawCards, mulberry32, combosForLabels, evaluate7CardHand, RANK_CHARS } from './cards.ts';
export function expandRangeToken(tok: string): string[] {
  const t = tok.trim();
  if (!t) return [];
  if (t.length === 4 && 'shdc'.includes(t[1]) && 'shdc'.includes(t[3])) return [t];
  const plus = t.endsWith('+');
  const base = plus ? t.slice(0, -1) : t;
  const r1 = RANK_CHARS.indexOf(base[0].toUpperCase());
  const r2 = RANK_CHARS.indexOf(base[1].toUpperCase());
  if (r1 < 0 || r2 < 0) return [];
  const suf = base.slice(2).toLowerCase();
  const mk = (a: number, b: number): string => RANK_CHARS[a] + RANK_CHARS[b] + suf;
  if (plus) {
    const out: string[] = [];
    if (r1 === r2) { for (let k = r1; k <= 12; k++) out.push(RANK_CHARS[k] + RANK_CHARS[k]); }
    else if (r1 === 12) { for (let k = r2; k <= 11; k++) out.push(mk(12, k)); }
    else { const gap = r1 - r2; for (let k = r1; k <= 12 && k - gap >= 0; k++) out.push(mk(k, k - gap)); }
    return out;
  }
  if (r1 === r2) return [RANK_CHARS[r1] + RANK_CHARS[r2]];
  if (suf === '') return [base.slice(0, 2) + 's', base.slice(0, 2) + 'o'];
  return [base[0].toUpperCase() + base[1].toUpperCase() + suf];
}
export function parseRange(text: string): string[] {
  const out = new Set<string>();
  for (const tok of text.split(/[\s,;]+/)) for (const l of expandRangeToken(tok)) out.add(l);
  return [...out];
}
export function rangeToCombos(text: string, dead: ReadonlySet<Card>): [Card, Card][] {
  const labels: string[] = []; const explicit: [Card, Card][] = [];
  for (const l of parseRange(text)) {
    if (l.length === 4) { const a = parseCard(l.slice(0, 2)), b = parseCard(l.slice(2, 4)); if (!dead.has(a) && !dead.has(b) && a !== b) explicit.push([a, b]); }
    else labels.push(l);
  }
  const seen = new Set(explicit.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
  for (const c of combosForLabels(labels, dead)) { const k = `${Math.min(c[0], c[1])}-${Math.max(c[0], c[1])}`; if (!seen.has(k)) { seen.add(k); explicit.push(c); } }
  return explicit;
}
export function exactEquityRiver(hero: readonly Card[], villainCombos: readonly [Card, Card][], board: readonly Card[]): number {
  if (board.length !== 5) throw new Error('exactEquityRiver requiere board de 5');
  let acc = 0, n = 0;
  const hs = evaluate7CardHand([...hero, ...board]).score;
  for (const vc of villainCombos) {
    if (hero.includes(vc[0]) || hero.includes(vc[1])) continue;
    const vs = evaluate7CardHand([...vc, ...board]).score;
    acc += hs > vs ? 1 : hs === vs ? 0.5 : 0; n++;
  }
  return n === 0 ? 0.5 : acc / n;
}
export interface EquityResult { heroPct: number; villainPct: number; tiePct: number; iterations: number; boardImpact: { name: string; pct: number }[] }
export function monteCarloEquity(heroRange: string, villainRange: string, boardText: string, iterations = 2000, seed = 7): EquityResult {
  const board = boardText.trim() ? parseCards(boardText) : [];
  const dead = new Set<Card>(board);
  const hc = rangeToCombos(heroRange, dead);
  const vc = rangeToCombos(villainRange, dead);
  if (hc.length === 0 || vc.length === 0) throw new Error('Rango vacio o sin combos disponibles tras el board');
  const rng = mulberry32(seed);
  let hw = 0, vw = 0, tie = 0, done = 0;
  const impact = new Map<string, number>();
  for (let i = 0; i < iterations; i++) {
    const h = hc[Math.floor(rng() * hc.length)];
    let v: [Card, Card] | null = null;
    for (let tries = 0; tries < 24; tries++) { const cand = vc[Math.floor(rng() * vc.length)]; if (cand[0] !== h[0] && cand[0] !== h[1] && cand[1] !== h[0] && cand[1] !== h[1]) { v = cand; break; } }
    if (!v) continue;
    const pool = availableDeck([...h, ...v, ...board]);
    const full = [...board, ...drawCards(rng, pool, 5 - board.length)];
    const he = evaluate7CardHand([...h, ...full]);
    const ve = evaluate7CardHand([...v, ...full]);
    if (he.score > ve.score) hw++; else if (he.score < ve.score) vw++; else tie++;
    impact.set(he.name, (impact.get(he.name) ?? 0) + 1);
    done++;
  }
  if (done === 0) throw new Error('Sin iteraciones validas');
  const r1 = (x: number): number => Math.round((x / done) * 10000) / 100;
  return { heroPct: r1(hw), villainPct: r1(vw), tiePct: r1(tie), iterations: done, boardImpact: [...impact.entries()].map(([name, n]) => ({ name, pct: r1(n) })).sort((a, b) => b.pct - a.pct) };
}
export function handStrengthPreflop(hero: readonly Card[], villainCombos: readonly [Card, Card][], sims: number, rng: () => number): number {
  let acc = 0;
  for (let i = 0; i < sims; i++) {
    const v = villainCombos[Math.floor(rng() * villainCombos.length)];
    if (v[0] === hero[0] || v[0] === hero[1] || v[1] === hero[0] || v[1] === hero[1]) { acc += 0.5; continue; }
    const pool = availableDeck([...hero, ...v]);
    const board = drawCards(rng, pool, 5);
    const hs = evaluate7CardHand([...hero, ...board]).score;
    const vs = evaluate7CardHand([...v, ...board]).score;
    acc += hs > vs ? 1 : hs === vs ? 0.5 : 0;
  }
  return acc / sims;
}
