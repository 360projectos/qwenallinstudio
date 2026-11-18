import type { Card } from './cards.ts';
import { FULL_DECK, drawCards, mulberry32, cardStr, hand169Label, combosForLabels } from './cards.ts';
import { handStrengthPreflop } from './rangeEquity.ts';
import { calculateSPR } from './spr.ts';
export const POSITIONS = ['UTG','MP','CO','BTN','SB','BB'] as const;
export type Position = (typeof POSITIONS)[number];
export const TRAINER_CATEGORIES = ['auto','srp_ip','srp_oop','3bet_ip','3bet_oop','sqz','rol','4bet','call','multiway'] as const;
export type TrainerCategory = (typeof TRAINER_CATEGORIES)[number];
export const ARCHETYPES = ['nit','tag','lag','fish','maniac'] as const;
export type Archetype = (typeof ARCHETYPES)[number];
export const RFI_RANGES: Record<Position, string[]> = {
  UTG: ['22+','ATs+','KJs+','QJs','JTs','T9s','98s','AQo+','KQo'],
  MP: ['22+','A9s+','KTs+','QTs+','JTs','T9s','98s','87s','AJo+','KQo'],
  CO: ['22+','A2s+','K9s+','Q9s+','J9s+','T8s+','97s+','87s','76s','65s','ATo+','KJo+','QJo'],
  BTN: ['22+','A2s+','K2s+','Q4s+','J6s+','T6s+','95s+','85s+','75s+','64s+','54s','A2o+','K8o+','Q9o+','J9o+','T9o'],
  SB: ['22+','A2s+','K5s+','Q8s+','J8s+','T8s+','97s+','86s+','76s','65s','A5o+','K9o+','QTo+','JTo'],
  BB: ['22+','A2s+','K2s+','Q2s+','J4s+','T5s+','95s+','85s+','75s+','64s+','53s+','43s','A2o+','K5o+','Q8o+','J8o+','T8o+','98o'],
};
export const VILLAIN_RANGES: Record<Archetype, string[]> = {
  nit: ['77+','ATs+','KJs+','AQo+'],
  tag: ['22+','A9s+','KTs+','QTs+','JTs','T9s','98s','AJo+','KQo'],
  lag: ['22+','A2s+','K7s+','Q9s+','J9s+','T8s+','97s+','87s','76s','ATo+','KJo+','QJo','JTo'],
  fish: ['22+','A2s+','K2s+','Q5s+','J6s+','T6s+','96s+','86s+','76s','65s','54s','A2o+','K7o+','Q9o+','J9o+','T9o'],
  maniac: ['22+','A2s+','K2s+','Q2s+','J2s+','T2s+','92s+','82s+','72s+','62s+','52s+','42s+','32s','A2o+','K2o+','Q2o+','J2o+','T2o+','92o+','82o+','72o+','62o+','52o+','42o+','32o'],
};
export const ARCHETYPE_LABEL: Record<Archetype, string> = { nit: 'Nit (muy tight)', tag: 'TAG (solido)', lag: 'LAG (agresivo)', fish: 'Fish (pasivo loose)', maniac: 'Maniac (hiperagresivo)' };
export interface TrainerSpot { id: string; hero: [Card, Card]; heroStr: string; position: Position; villainPos: Position; archetype: Archetype; category: Exclude<TrainerCategory, 'auto'>; potBB: number; effStackBB: number; sprValue: number; sprLabel: string; situation: string; options: string[]; villainRange: string[]; investedBB: number }
const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
function finish(seed: number, hero: [Card, Card], position: Position, villainPos: Position, archetype: Archetype, category: Exclude<TrainerCategory, 'auto'>, potBB: number, effStackBB: number, situation: string, options: string[], villainRange: string[], investedBB: number): TrainerSpot {
  const spr = calculateSPR(effStackBB - investedBB, potBB);
  return { id: `spot-${seed}`, hero, heroStr: hero.map(cardStr).join(' '), position, villainPos, archetype, category, potBB, effStackBB, sprValue: spr.value, sprLabel: spr.label, situation, options, villainRange, investedBB };
}
export function generateSpot(seed: number, category: TrainerCategory = 'auto', heroPos?: Position): TrainerSpot {
  const rng = mulberry32(seed);
  const cat: Exclude<TrainerCategory, 'auto'> = category === 'auto' ? pick(rng, TRAINER_CATEGORIES.slice(1)) as Exclude<TrainerCategory, 'auto'> : category;
  const pos: Position = heroPos ?? pick(rng, POSITIONS);
  const hero = drawCards(rng, FULL_DECK, 2) as [Card, Card];
  const archetype = pick(rng, ARCHETYPES);
  const villainRange = VILLAIN_RANGES[archetype];
  let villainPos: Position = 'BB'; let potBB = 1.5; let effStackBB = 100; let investedBB = 0;
  let situation = ''; let options: string[] = ['fold', 'call', 'raise'];
  switch (cat) {
    case 'srp_ip': { const p: Position = pos === 'BB' || pos === 'SB' ? 'BTN' : pos; situation = `Pot sin abrir. ${p} abre 2.5bb o foldea (IP vs BB).`; options = ['fold', 'open']; return finish(seed, hero, p, 'BB', archetype, cat, 1.5, effStackBB, situation, options, villainRange, 0); }
    case 'srp_oop': { situation = 'Pot sin abrir en SB (OOP vs BB). Raise 3bb o fold.'; options = ['fold', 'open']; return finish(seed, hero, 'SB', 'BB', archetype, cat, 1.5, effStackBB, situation, options, villainRange, 0); }
    case '3bet_ip': { situation = `Abres 2.5bb desde ${pos === 'BB' ? 'CO' : pos}, BB 3-betea a 11bb. IP: fold/call/4bet a 24bb.`; options = ['fold', 'call', '4bet']; potBB = 13.5; investedBB = 2.5; villainPos = 'BB'; break; }
    case '3bet_oop': { situation = 'Abres 2.5bb desde SB, BTN 3-betea a 10bb. OOP: fold/call/4bet a 23bb.'; options = ['fold', 'call', '4bet']; return finish(seed, hero, 'SB', 'BTN', archetype, cat, 12.5, effStackBB, situation, options, villainRange, 2.5); }
    case 'sqz': { situation = 'Abres 2.5bb, CO paga y BTN squeeze a 14bb. Fold/call/4bet a 30bb.'; options = ['fold', 'call', '4bet']; potBB = 19; investedBB = 2.5; villainPos = 'BTN'; break; }
    case 'rol': { situation = 'SB vs BB: raise-or-limp. Fold / limp / raise 3bb.'; options = ['fold', 'limp', 'raise']; return finish(seed, hero, 'SB', 'BB', archetype, cat, 1.5, effStackBB, situation, options, villainRange, 0.5); }
    case '4bet': { situation = '3-beteas a 11bb y BTN 4-betea a 27bb. Fold/call/5bet all-in.'; options = ['fold', 'call', 'allin']; potBB = 38; investedBB = 11; villainPos = 'BTN'; break; }
    case 'call': { situation = 'BB vs open de BTN a 2.5bb. Fold/call/3bet a 11bb.'; options = ['fold', 'call', '3bet']; return finish(seed, hero, 'BB', 'BTN', archetype, cat, 4, effStackBB, situation, options, villainRange, 1); }
    case 'multiway': { situation = 'Pot 3-way: CO abre 2.5bb, BTN paga. BB: fold/call/3bet squeeze.'; options = ['fold', 'call', '3bet']; return finish(seed, hero, 'BB', 'CO', archetype, cat, 6.5, effStackBB, situation, options, villainRange, 1); }
  }
  return finish(seed, hero, pos, villainPos, archetype, cat, potBB, effStackBB, situation, options, villainRange, investedBB);
}
export interface DecisionEval { action: string; evBB: number; best: string; evLossBB: number; equity: number }
function expandHas(rangeLabel: string, hand: string): boolean {
  if (rangeLabel.endsWith('+')) {
    const base = rangeLabel.slice(0, -1);
    const R = '23456789TJQKA';
    const r1 = R.indexOf(base[0]), r2 = R.indexOf(base[1]);
    const h1 = R.indexOf(hand[0]), h2 = R.indexOf(hand[1]);
    const hsuf = hand.slice(2), bsuf = base.slice(2);
    if (hsuf !== bsuf && bsuf !== '') return false;
    if (r1 === r2) return h1 === h2 && h1 >= r1;
    if (r1 === 12) return h1 === 12 && h2 >= r2 && hsuf === bsuf;
    return h1 - h2 === r1 - r2 && h1 >= r1 && hsuf === bsuf;
  }
  if (rangeLabel.length === 2 && !rangeLabel.endsWith('s') && !rangeLabel.endsWith('o')) return hand.slice(0, 2) === rangeLabel;
  return rangeLabel === hand;
}
export function evaluateDecision(spot: TrainerSpot, action: string, seed = 99): DecisionEval {
  const rng = mulberry32(seed);
  const vc = combosForLabels(spot.villainRange, new Set<Card>(spot.hero));
  const equity = handStrengthPreflop(spot.hero, vc, 120, rng);
  const label = hand169Label(spot.hero[0], spot.hero[1]);
  const inRfi = RFI_RANGES[spot.position].some((l) => expandHas(l, label));
  const evs: Record<string, number> = {};
  const callCost = Math.max(0, spot.potBB - spot.investedBB - 1);
  for (const a of spot.options) {
    if (a === 'fold') evs[a] = 0;
    else if (a === 'open' || a === 'raise' || a === '3bet' || a === 'limp') {
      const foldEq = a === 'limp' ? 0 : 0.38;
      const size = a === 'limp' ? 0.5 : 2.5;
      evs[a] = foldEq * spot.potBB + (1 - foldEq) * (equity * (spot.potBB + 2 * size) - size) - (inRfi ? 0 : 0.8);
    } else if (a === 'call') evs[a] = equity * (spot.potBB + callCost) - (1 - equity) * callCost;
    else if (a === '4bet' || a === 'allin') {
      const foldEq = a === 'allin' ? 0.18 : 0.3;
      const size = a === 'allin' ? spot.effStackBB : 24;
      evs[a] = foldEq * spot.potBB + (1 - foldEq) * (equity * (spot.potBB + 2 * size) - size);
    } else evs[a] = 0;
  }
  let best = spot.options[0];
  for (const a of spot.options) if (evs[a] > evs[best]) best = a;
  const chosen = evs[action] ?? evs.fold ?? 0;
  return { action, evBB: Math.round(chosen * 100) / 100, best, evLossBB: Math.round(Math.max(0, evs[best] - chosen) * 100) / 100, equity: Math.round(equity * 1000) / 1000 };
}
export interface HandResult { category: string; evLossBB: number; chosen: string; best: string }
export interface LeakReport { leaks: { category: string; hands: number; avgLossBB: number; totalLossBB: number; severity: 'alta' | 'media' | 'baja' }[]; profile: string; plan: string[]; totalEvLossBB: number }
export function aggregateLeaks(results: HandResult[]): LeakReport {
  const byCat = new Map<string, HandResult[]>();
  for (const r of results) { const arr = byCat.get(r.category) ?? []; arr.push(r); byCat.set(r.category, arr); }
  const leaks = [...byCat.entries()].map(([category, arr]) => {
    const total = arr.reduce((a, r) => a + r.evLossBB, 0);
    const avg = total / arr.length;
    return { category, hands: arr.length, avgLossBB: Math.round(avg * 100) / 100, totalLossBB: Math.round(total * 100) / 100, severity: (avg > 0.5 ? 'alta' : avg > 0.2 ? 'media' : 'baja') as 'alta' | 'media' | 'baja' };
  }).filter((l) => l.avgLossBB > 0.05).sort((a, b) => b.totalLossBB - a.totalLossBB);
  const foldRate = results.filter((r) => r.chosen === 'fold').length / Math.max(1, results.length);
  const aggrRate = results.filter((r) => ['raise', 'open', '3bet', '4bet', 'allin'].includes(r.chosen)).length / Math.max(1, results.length);
  const profile = foldRate > 0.6 ? 'Nit / overfolder' : aggrRate > 0.55 ? 'LAG / overagresivo' : foldRate > 0.4 ? 'TAG pasivo' : 'Regular equilibrado';
  const plan = leaks.slice(0, 3).map((l) => `Drill de 50 manos en ${l.category} (fuga ${l.avgLossBB} bb/mano, severidad ${l.severity})`);
  if (plan.length === 0) plan.push('Sin fugas >0.05 bb/mano: sube dificultad y filtra por arquetipo maniac');
  return { leaks, profile, plan, totalEvLossBB: Math.round(results.reduce((a, r) => a + r.evLossBB, 0) * 100) / 100 };
}
export function runDiagnostic(seed: number, n = 100, category: TrainerCategory = 'auto'): { results: HandResult[]; report: LeakReport } {
  const rng = mulberry32(seed);
  const results: HandResult[] = [];
  for (let i = 0; i < n; i++) {
    const spot = generateSpot(seed * 1000 + i, category);
    const ev = evaluateDecision(spot, spot.options[0], seed + i);
    const skilled = rng() < 0.72;
    const chosen = skilled ? ev.best : pick(rng, spot.options);
    const scored = evaluateDecision(spot, chosen, seed + i);
    results.push({ category: spot.category, evLossBB: scored.evLossBB, chosen, best: ev.best });
  }
  return { results, report: aggregateLeaks(results) };
}
