import { mulberry32 } from './cards.ts';
export function malmuthHarville(stacks: readonly number[], payouts: readonly number[]): number[] {
  const n = stacks.length;
  if (n < 2 || n > 10) throw new Error('ICM soporta 2..10 jugadores');
  if (payouts.length > n) throw new Error('Mas premios que jugadores');
  if (stacks.some((s) => s <= 0)) throw new Error('Stacks deben ser positivos');
  const full = (1 << n) - 1;
  const totals = new Map<number, number>();
  const total = (mask: number): number => {
    let t = totals.get(mask);
    if (t === undefined) { t = 0; for (let i = 0; i < n; i++) if (mask & (1 << i)) t += stacks[i]; totals.set(mask, t); }
    return t;
  };
  const memo = new Map<string, number>();
  const pPlace = (mask: number, i: number, place: number): number => {
    if (place === 1) return stacks[i] / total(mask);
    const key = `${mask}|${i}|${place}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let acc = 0; const t = total(mask);
    for (let j = 0; j < n; j++) { if (j === i || !(mask & (1 << j))) continue; acc += (stacks[j] / t) * pPlace(mask & ~(1 << j), i, place - 1); }
    memo.set(key, acc); return acc;
  };
  const eq: number[] = [];
  for (let i = 0; i < n; i++) { let e = 0; for (let k = 1; k <= payouts.length; k++) e += payouts[k - 1] * pPlace(full, i, k); eq.push(e); }
  return eq;
}
export interface VarianceOpts { winrateBB100: number; sdBB100: number; handsPerSession: number; sessions?: number; seed?: number }
export interface VarianceResult { sessions: number; meanBB: number; p5: number; p50: number; p95: number; probLosingSession: number; maxDrawdownBB: number; longestLosingStreak: number }
export function simulateVariance(o: VarianceOpts): VarianceResult {
  const sessions = o.sessions ?? 2000;
  const rng = mulberry32(o.seed ?? 42);
  const mean = (o.winrateBB100 * o.handsPerSession) / 100;
  const sd = o.sdBB100 * Math.sqrt(o.handsPerSession / 100);
  const results: number[] = [];
  let losing = 0, streak = 0, maxStreak = 0, cum = 0, peak = 0, maxDD = 0;
  for (let i = 0; i < sessions; i++) {
    const u1 = Math.max(rng(), 1e-12), u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const bb = mean + sd * z;
    results.push(bb);
    if (bb < 0) { losing++; streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0;
    cum += bb; peak = Math.max(peak, cum); maxDD = Math.max(maxDD, peak - cum);
  }
  const sorted = [...results].sort((a, b) => a - b);
  const pct = (p: number): number => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
  const r2 = (x: number): number => Math.round(x * 100) / 100;
  return { sessions, meanBB: r2(results.reduce((a, b) => a + b, 0) / sessions), p5: r2(pct(5)), p50: r2(pct(50)), p95: r2(pct(95)), probLosingSession: r2((losing / sessions) * 100), maxDrawdownBB: r2(maxDD), longestLosingStreak: maxStreak };
}
