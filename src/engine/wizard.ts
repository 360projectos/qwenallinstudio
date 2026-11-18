// Wizard 4 Fases · motor de decision por calle con Action Gauge (frecuencias) y logica SPR
import type { Card } from './cards.ts';
import { combosForLabels, mulberry32, availableDeck, drawCards, evaluate7CardHand, boardTexture } from './cards.ts';
import { handStrengthPreflop, exactEquityRiver } from './rangeEquity.ts';
import { calculateSPR, type SprResult } from './spr.ts';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export const STREETS: Street[] = ['preflop', 'flop', 'turn', 'river'];
export interface WizardSpot { street: Street; hero: [Card, Card]; board: Card[]; potBB: number; effStackBB: number; heroIP: boolean; villainRange: string[]; facingBet: boolean; callCostBB: number }
export interface ActionFreq { action: string; freq: number; evBB: number }
export interface WizardDecision { actions: ActionFreq[]; spr: SprResult; equity: number; recommended: string; texture: ReturnType<typeof boardTexture>; rationale: string }
const clamp = (x: number, a: number, b: number): number => Math.max(a, Math.min(b, x));
const smooth = (e: number, a: number, b: number): number => clamp((e - a) / (b - a), 0, 1);
function equityOnBoard(hero: readonly Card[], board: readonly Card[], vCombos: readonly [Card, Card][], iters: number, rng: () => number): number {
  if (board.length === 5) return exactEquityRiver(hero, vCombos, board);
  if (vCombos.length === 0) return 0.5;
  const pool = availableDeck([...hero, ...board]);
  let acc = 0;
  for (let i = 0; i < iters; i++) {
    const v = vCombos[Math.floor(rng() * vCombos.length)];
    if (v[0] === hero[0] || v[0] === hero[1] || v[1] === hero[0] || v[1] === hero[1]) { acc += 0.5; continue; }
    const b = [...board, ...drawCards(rng, pool.filter((c) => c !== v[0] && c !== v[1]), 5 - board.length)];
    const hs = evaluate7CardHand([...hero, ...b]).score;
    const vs = evaluate7CardHand([...v, ...b]).score;
    acc += hs > vs ? 1 : hs === vs ? 0.5 : 0;
  }
  return acc / iters;
}
export function decideWizard(spot: WizardSpot, seed = 7): WizardDecision {
  const rng = mulberry32(seed);
  const dead = new Set<Card>([...spot.hero, ...spot.board]);
  const vCombos = combosForLabels(spot.villainRange, dead);
  const equity = spot.board.length === 0 ? handStrengthPreflop(spot.hero, vCombos, 220, rng) : equityOnBoard(spot.hero, spot.board, vCombos, 220, rng);
  const spr = calculateSPR(spot.effStackBB, spot.potBB);
  const texture = boardTexture(spot.board);
  const e = equity;
  const ip = spot.heroIP;
  let actions: ActionFreq[] = [];
  let rationale = '';
  const potOdds = spot.callCostBB > 0 ? spot.callCostBB / (spot.potBB + spot.callCostBB) : 0.2;
  if (spot.facingBet) {
    const raise = smooth(e, 0.60, 0.86) * (ip ? 0.92 : 0.78);
    const call = smooth(e, potOdds - 0.04, 0.56) * (1 - raise);
    const fold = clamp(1 - raise - call, 0, 1);
    const tot = raise + call + fold || 1;
    actions = [
      { action: 'fold', freq: fold / tot, evBB: 0 },
      { action: 'call', freq: call / tot, evBB: Math.round((e * (spot.potBB + spot.callCostBB) - (1 - e) * spot.callCostBB) * 100) / 100 },
      { action: 'raise', freq: raise / tot, evBB: Math.round((0.3 * spot.potBB + 0.7 * (e * (spot.potBB + 2 * spot.callCostBB * 2.2) - spot.callCostBB * 2.2)) * 100) / 100 },
    ];
    rationale = e >= 0.66 ? 'Mano fuerte: raise por valor y presion.' : e >= potOdds + 0.04 ? 'Equidad suficiente para pagar por pot odds.' : 'Equidad insuficiente: fold salvo farol con blockers.';
  } else if (spot.street === 'preflop') {
    const raise = smooth(e, 0.50, 0.72) * (ip ? 0.95 : 0.85);
    const call = smooth(e, 0.40, 0.55) * (1 - raise) * 0.6;
    const fold = clamp(1 - raise - call, 0, 1);
    const tot = raise + call + fold || 1;
    actions = [
      { action: 'fold', freq: fold / tot, evBB: 0 },
      { action: 'call', freq: call / tot, evBB: Math.round((e * 5 - 1) * 100) / 100 },
      { action: 'raise', freq: raise / tot, evBB: Math.round((0.4 * 1.5 + 0.6 * (e * 7 - 2.5)) * 100) / 100 },
    ];
    rationale = e >= 0.6 ? 'Premium: raise/3bet por valor.' : e >= 0.45 ? 'Mano jugable: call o raise segun posicion.' : 'Fuera de rango: fold.';
  } else {
    const value = smooth(e, 0.55, 0.82);
    const bluffChance = (1 - smooth(e, 0.18, 0.45)) * ((texture.paired || texture.monotone) ? 0.18 : 0.34) * (ip ? 1 : 0.7) * (spot.street === 'river' ? 0.8 : 1);
    const bet = clamp(value * 0.9 + bluffChance, 0, 0.95);
    const check = 1 - bet;
    const betSize = spot.potBB * (spr.value <= 3 ? 0.75 : 0.5);
    actions = [
      { action: 'check', freq: check, evBB: Math.round(e * spot.potBB * 0.5 * 100) / 100 },
      { action: 'bet', freq: bet, evBB: Math.round((0.35 * spot.potBB + 0.65 * (e * (spot.potBB + 2 * betSize) - betSize)) * 100) / 100 },
    ];
    rationale = e >= 0.6 ? 'Valor: bet para construir el bote.' : e <= 0.35 ? 'Farol con blockers en textura favorable.' : 'Mano media: check para controlar el bote y realizar equidad.';
  }
  let recommended = actions[0].action;
  for (const a of actions) if (a.freq > actions.find((x) => x.action === recommended)!.freq) recommended = a.action;
  return { actions, spr, equity: Math.round(e * 1000) / 1000, recommended, texture, rationale };
}
