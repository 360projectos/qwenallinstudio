import type { Card } from './cards.ts';
import { ALL_169, combosForLabels, mulberry32, availableDeck, drawCards, evaluate7CardHand } from './cards.ts';
import { exactEquityRiver } from './rangeEquity.ts';
export interface DcfrConfig { potBB: number; stackBB: number; board: Card[]; heroLabels: string[]; villainLabels: string[]; heroIP: boolean; betFractions?: number[]; iterations?: number; seed?: number }
export interface DcfrAudit { iterations: number; infosets: number; treeNodes: number; exploitabilityBB: number; profileValueBB: number }
export interface ComboStrategy { label: string; combos: number; equity: number; bucket: number; actions: Record<string, number>; ev: number }
export interface DcfrResult { grid: (ComboStrategy | null)[]; audit: DcfrAudit; bucketStrategies: Record<string, Record<string, number>> }
interface TAction { key: string; to: number }
interface TNode { player: 0 | 1; history: string; contrib: [number, number]; pot: number; actions: TAction[]; terminal: 'fold0' | 'fold1' | 'showdown' | null }
interface Tree { nodes: TNode[]; root: number }
function buildTree(potBB: number, stackBB: number, heroIP: boolean, fractions: number[]): Tree {
  const nodes: TNode[] = [];
  const push = (n: TNode): number => { nodes.push(n); return nodes.length - 1; };
  const terminal = (kind: 'fold0' | 'fold1' | 'showdown', contrib: [number, number], pot: number): number => push({ player: 0, history: '', contrib, pot, actions: [], terminal: kind });
  function make(history: string, player: 0 | 1, contrib: [number, number], pot: number, facing: boolean, raised: boolean): number {
    const idx = push({ player, history, contrib, pot, actions: [], terminal: null });
    const other = (1 - player) as 0 | 1;
    const rem = (p: 0 | 1): number => stackBB - contrib[p];
    const acts: TAction[] = [];
    const used = new Set<string>();
    if (!facing) {
      const checked = history.endsWith('k');
      acts.push({ key: 'check', to: checked ? terminal('showdown', contrib, pot) : make(history + 'k', other, contrib, pot, false, false) });
      if (rem(player) > 1e-9) {
        for (const f of fractions) {
          const amt = Math.min(f * pot, rem(player));
          if (amt <= 1e-9) continue;
          const allin = amt >= rem(player) - 1e-9;
          const key = allin ? 'allin' : `bet${Math.round(f * 100)}`;
          if (used.has(key)) continue;
          used.add(key);
          const nc: [number, number] = [contrib[0], contrib[1]]; nc[player] += amt;
          acts.push({ key, to: make(history + '|' + key, other, nc, pot + amt, true, allin) });
        }
      }
    } else {
      acts.push({ key: 'fold', to: terminal(player === 0 ? 'fold0' : 'fold1', contrib, pot) });
      const callAmt = Math.min(contrib[other] - contrib[player], rem(player));
      const nc: [number, number] = [contrib[0], contrib[1]]; nc[player] += callAmt;
      acts.push({ key: 'call', to: terminal('showdown', nc, pot + callAmt) });
      if (!raised && rem(player) > callAmt + 1e-9 && rem(other) > 1e-9) {
        const amt = rem(player);
        const nc2: [number, number] = [contrib[0], contrib[1]]; nc2[player] += amt;
        acts.push({ key: 'raise', to: make(history + '|raise', other, nc2, pot + amt, true, true) });
      }
    }
    nodes[idx].actions = acts;
    return idx;
  }
  const first: 0 | 1 = heroIP ? 1 : 0;
  return { nodes, root: make('', first, [0, 0], potBB, false, false) };
}
const ALPHA = 1.5, GAMMA = 2;
function regretMatch(r: number[]): number[] {
  let sum = 0;
  const pos = r.map((x) => { const p = Math.max(0, x); sum += p; return p; });
  return sum > 0 ? pos.map((p) => p / sum) : r.map(() => 1 / r.length);
}
export interface MatrixSolution { row: number[]; col: number[]; value: number }
export function solveMatrixGame(payoff: number[][], iterations = 3000): MatrixSolution {
  const n = payoff.length, m = payoff[0].length;
  const rR = new Array<number>(n).fill(0), rC = new Array<number>(m).fill(0);
  const sR = new Array<number>(n).fill(0), sC = new Array<number>(m).fill(0);
  for (let t = 1; t <= iterations; t++) {
    const pm = t ** ALPHA / (t ** ALPHA + 1);
    const sm = (t / (t + 1)) ** GAMMA;
    for (let i = 0; i < n; i++) { rR[i] *= rR[i] > 0 ? pm : 0.5; sR[i] *= sm; }
    for (let j = 0; j < m; j++) { rC[j] *= rC[j] > 0 ? pm : 0.5; sC[j] *= sm; }
    const sr = regretMatch(rR), sc = regretMatch(rC);
    const vRow = payoff.map((row) => row.reduce((a, p, j) => a + p * sc[j], 0));
    const v = sr.reduce((a, s, i) => a + s * vRow[i], 0);
    for (let i = 0; i < n; i++) { rR[i] += vRow[i] - v; sR[i] += sr[i]; }
    for (let j = 0; j < m; j++) { const vCol = payoff.reduce((a, row, i) => a + row[j] * sr[i], 0); rC[j] += v - vCol; sC[j] += sc[j]; }
  }
  const norm = (s: number[]): number[] => { const t = s.reduce((a, b) => a + b, 0); return t > 0 ? s.map((x) => x / t) : s.map(() => 1 / s.length); };
  const row = norm(sR), col = norm(sC);
  const value = row.reduce((a, s, i) => a + s * payoff[i].reduce((b, p, j) => b + p * col[j], 0), 0);
  return { row, col, value };
}
const bucketOf = (eq: number): number => (eq < 0.45 ? 0 : eq < 0.68 ? 1 : 2);
function stratSample<T>(arr: readonly T[], k: number, rng: () => number): T[] {
  if (arr.length <= k) return [...arr];
  const out: T[] = []; const step = arr.length / k;
  for (let i = 0; i < k; i++) out.push(arr[Math.min(arr.length - 1, Math.floor(i * step + rng() * step))]);
  return out;
}
function equityOf(hero: readonly Card[], vCombos: readonly [Card, Card][], board: readonly Card[], rng: () => number, mcIters: number): number {
  if (vCombos.length === 0) return 0.5;
  if (board.length === 5) return exactEquityRiver(hero, vCombos, board);
  const pool = availableDeck([...hero, ...board]);
  let acc = 0;
  for (let i = 0; i < mcIters; i++) {
    const v = vCombos[Math.floor(rng() * vCombos.length)];
    if (v[0] === hero[0] || v[0] === hero[1] || v[1] === hero[0] || v[1] === hero[1]) { acc += 0.5; continue; }
    const b = [...board, ...drawCards(rng, pool.filter((c) => c !== v[0] && c !== v[1]), 5 - board.length)];
    const hs = evaluate7CardHand([...hero, ...b]).score;
    const vs = evaluate7CardHand([...v, ...b]).score;
    acc += hs > vs ? 1 : hs === vs ? 0.5 : 0;
  }
  return acc / mcIters;
}
interface Solution { stratAt: (n: TNode, b: number) => number[]; evalProfile: (idx: number, heroBucket: number, bv: number, eq: number) => number; audit: DcfrAudit }
function solveTree(tree: Tree, pHero: number[], pVillain: number[], E: number[][], iterations: number): Solution {
  const regrets = new Map<string, number[]>();
  const sums = new Map<string, number[]>();
  const key = (n: TNode, b: number): string => `${n.player}|${b}|${n.history}`;
  const get = (map: Map<string, number[]>, k: string, len: number): number[] => { let a = map.get(k); if (!a) { a = new Array<number>(len).fill(0); map.set(k, a); } return a; };
  const terminalEV = (n: TNode, eq: number): number => {
    if (n.terminal === 'showdown') return (eq - 0.5) * n.pot;
    const minC = Math.min(n.contrib[0], n.contrib[1]);
    return n.terminal === 'fold1' ? minC : -minC;
  };
  function traverse(idx: number, bh: number, bv: number, r0: number, r1: number, cw: number): number {
    const n = tree.nodes[idx];
    if (n.terminal) return terminalEV(n, E[bh][bv]);
    const k = key(n, n.player === 0 ? bh : bv);
    const reg = get(regrets, k, n.actions.length);
    const strat = regretMatch(reg);
    const vals: number[] = [];
    let nodeV = 0;
    for (let i = 0; i < n.actions.length; i++) {
      const v = n.player === 0 ? traverse(n.actions[i].to, bh, bv, r0 * strat[i], r1, cw) : traverse(n.actions[i].to, bh, bv, r0, r1 * strat[i], cw);
      vals.push(v); nodeV += strat[i] * v;
    }
    const sum = get(sums, k, n.actions.length);
    const opp = n.player === 0 ? r1 : r0;
    const own = n.player === 0 ? r0 : r1;
    const sign = n.player === 0 ? 1 : -1;
    for (let i = 0; i < n.actions.length; i++) { reg[i] += sign * opp * cw * (vals[i] - nodeV); sum[i] += own * cw * strat[i]; }
    return nodeV;
  }
  for (let t = 1; t <= iterations; t++) {
    const pm = t ** ALPHA / (t ** ALPHA + 1);
    const sm = (t / (t + 1)) ** GAMMA;
    for (const arr of regrets.values()) for (let i = 0; i < arr.length; i++) arr[i] *= arr[i] > 0 ? pm : 0.5;
    for (const arr of sums.values()) for (let i = 0; i < arr.length; i++) arr[i] *= sm;
    for (let bh = 0; bh < 3; bh++) for (let bv = 0; bv < 3; bv++) { const cw = pHero[bh] * pVillain[bv]; if (cw > 1e-12) traverse(tree.root, bh, bv, 1, 1, cw); }
  }
  const avg = new Map<string, number[]>();
  for (const [k, s] of sums) { const tot = s.reduce((a, b) => a + b, 0); avg.set(k, tot > 0 ? s.map((x) => x / tot) : s.map(() => 1 / s.length)); }
  const stratAt = (n: TNode, b: number): number[] => avg.get(key(n, b)) ?? n.actions.map(() => 1 / n.actions.length);
  function evalProfile(idx: number, heroBucket: number, bv: number, eq: number): number {
    const n = tree.nodes[idx];
    if (n.terminal) return terminalEV(n, eq);
    const s = stratAt(n, n.player === 0 ? heroBucket : bv);
    let v = 0;
    for (let i = 0; i < n.actions.length; i++) v += s[i] * evalProfile(n.actions[i].to, heroBucket, bv, eq);
    return v;
  }
  function bestResponse(idx: number, bh: number, bv: number, forHero: boolean): number {
    const n = tree.nodes[idx];
    if (n.terminal) return terminalEV(n, E[bh][bv]);
    const isBR = (n.player === 0) === forHero;
    const s = stratAt(n, n.player === 0 ? bh : bv);
    let best = forHero ? -Infinity : Infinity;
    let mix = 0;
    for (let i = 0; i < n.actions.length; i++) { const v = bestResponse(n.actions[i].to, bh, bv, forHero); if (isBR) best = forHero ? Math.max(best, v) : Math.min(best, v); mix += s[i] * v; }
    return isBR ? best : mix;
  }
  let pv = 0, brH = 0, brV = 0;
  for (let bh = 0; bh < 3; bh++) for (let bv = 0; bv < 3; bv++) {
    const w = pHero[bh] * pVillain[bv];
    if (w <= 1e-12) continue;
    pv += w * evalProfile(tree.root, bh, bv, E[bh][bv]);
    brH += w * bestResponse(tree.root, bh, bv, true);
    brV += w * bestResponse(tree.root, bh, bv, false);
  }
  return { stratAt, evalProfile, audit: { iterations, infosets: regrets.size, treeNodes: tree.nodes.length, exploitabilityBB: Math.max(0, brH - brV), profileValueBB: pv } };
}
interface SolvedBase { tree: Tree; sol: Solution; pV: number[]; vBucketCombos: [Card, Card][][]; rng: () => number; board: Card[]; dead: Set<Card>; heroFirstNode: TNode }
function solveBase(config: DcfrConfig): SolvedBase {
  const board = config.board;
  const dead = new Set<Card>(board);
  const heroCombos = combosForLabels(config.heroLabels, dead);
  const villainCombos = combosForLabels(config.villainLabels, dead);
  if (heroCombos.length === 0 || villainCombos.length === 0) throw new Error('Rangos sin combos disponibles para este board');
  const rng = mulberry32(config.seed ?? 11);
  const vSample = stratSample(villainCombos, 60, rng);
  const hSample = stratSample(heroCombos, 60, rng);
  const hBucketCombos: [Card, Card][][] = [[], [], []];
  const vBucketCombos: [Card, Card][][] = [[], [], []];
  const hCount = [0, 0, 0]; const vCount = [0, 0, 0];
  for (const label of config.heroLabels) {
    const combos = combosForLabels([label], dead);
    if (combos.length === 0) continue;
    const reps = stratSample(combos, 2, rng);
    const eq = reps.reduce((a, c) => a + equityOf(c, vSample, board, rng, 30), 0) / reps.length;
    const b = bucketOf(eq);
    hCount[b] += combos.length;
    hBucketCombos[b].push(...combos);
  }
  for (const label of config.villainLabels) {
    const combos = combosForLabels([label], dead);
    if (combos.length === 0) continue;
    const reps = stratSample(combos, 2, rng);
    const eq = reps.reduce((a, c) => a + equityOf(c, hSample, board, rng, 30), 0) / reps.length;
    const b = bucketOf(1 - eq);
    vCount[b] += combos.length;
    vBucketCombos[b].push(...combos);
  }
  const norm = (c: number[]): number[] => { const t = c.reduce((a, b) => a + b, 0); return t > 0 ? c.map((x) => x / t) : [1 / 3, 1 / 3, 1 / 3]; };
  const pHero = norm(hCount), pV = norm(vCount);
  const E: number[][] = [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]];
  for (let bh = 0; bh < 3; bh++) for (let bv = 0; bv < 3; bv++) {
    if (hCount[bh] === 0 || vCount[bv] === 0) continue;
    const hs = stratSample(hBucketCombos[bh], 8, rng);
    const vs = stratSample(vBucketCombos[bv], 8, rng);
    E[bh][bv] = hs.reduce((a, h) => a + equityOf(h, vs, board, rng, 25), 0) / hs.length;
  }
  const tree = buildTree(config.potBB, config.stackBB, config.heroIP, config.betFractions ?? [0.5, 1]);
  const sol = solveTree(tree, pHero, pV, E, config.iterations ?? 400);
  const root = tree.nodes[tree.root];
  let heroFirstNode = root;
  if (root.player === 1) { const checkAct = root.actions.find((a) => a.key === 'check'); if (checkAct) heroFirstNode = tree.nodes[checkAct.to]; }
  return { tree, sol, pV, vBucketCombos, rng, board, dead, heroFirstNode };
}
function bucketStrategiesOf(base: SolvedBase): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (let b = 0; b < 3; b++) {
    const s = base.sol.stratAt(base.heroFirstNode, b);
    const rec: Record<string, number> = {};
    base.heroFirstNode.actions.forEach((a, i) => { rec[a.key] = Math.round(s[i] * 1000) / 1000; });
    out[`bucket${b}`] = rec;
  }
  return out;
}
export function solveDCFRSubgame(config: DcfrConfig): { audit: DcfrAudit; bucketStrategies: Record<string, Record<string, number>> } {
  const base = solveBase(config);
  return { audit: base.sol.audit, bucketStrategies: bucketStrategiesOf(base) };
}
export function generateCombosStrategy(config: DcfrConfig): DcfrResult {
  const base = solveBase(config);
  const grid: (ComboStrategy | null)[] = ALL_169.map((label) => {
    const combos = combosForLabels([label], base.dead);
    if (combos.length === 0) return null;
    const reps = stratSample(combos, 2, base.rng);
    const eqRow = [0, 1, 2].map((bv) => {
      if (base.pV[bv] <= 1e-12) return 0.5;
      const vs = stratSample(base.vBucketCombos[bv], 10, base.rng);
      return reps.reduce((a, c) => a + equityOf(c, vs, base.board, base.rng, 25), 0) / reps.length;
    });
    const eq = eqRow.reduce((a, e, bv) => a + base.pV[bv] * e, 0);
    const bucket = bucketOf(eq);
    const s = base.sol.stratAt(base.heroFirstNode, bucket);
    const actions: Record<string, number> = {};
    base.heroFirstNode.actions.forEach((a, i) => { actions[a.key] = Math.round(s[i] * 1000) / 1000; });
    const ev = eqRow.reduce((a, e, bv) => a + base.pV[bv] * base.sol.evalProfile(base.tree.root, bucket, bv, e), 0);
    return { label, combos: combos.length, equity: Math.round(eq * 1000) / 1000, bucket, actions, ev: Math.round(ev * 100) / 100 };
  });
  return { grid, audit: base.sol.audit, bucketStrategies: bucketStrategiesOf(base) };
}
