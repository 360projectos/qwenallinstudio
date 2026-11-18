import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCards } from '../src/engine/cards.ts';
import { parseRange } from '../src/engine/rangeEquity.ts';
import { decideWizard, type WizardSpot } from '../src/engine/wizard.ts';
import { generateCombosStrategy } from '../src/engine/dcfr.ts';
import { SCENARIOS } from '../src/data/scenarios.ts';
import { WIZARD_HANDS } from '../src/data/wizardHands.ts';
import { recordDecision, getLeaks, getErrorCards, reviewErrorCard } from '../src/lib/progress.ts';
// shim de localStorage para node
const store = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); },
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
  clear: () => store.clear(),
};
const VR = parseRange('22+,A9s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo');
const spot = (hero: string, board: string, facingBet: boolean, street: WizardSpot['street']): WizardSpot => ({
  street, hero: parseCards(hero) as [number, number], board: board ? parseCards(board) : [], potBB: 6.5, effStackBB: 97, heroIP: true, villainRange: VR, facingBet, callCostBB: 2.5,
});
test('wizard: frecuencias del Action Gauge suman 1', () => {
  for (const s of [spot('AhAs', '', true, 'preflop'), spot('9d9c', '9h Kd 4c', false, 'flop'), spot('AhKh', 'Ks 7d 2c 9s', true, 'turn')]) {
    const d = decideWizard(s, 3);
    const sum = d.actions.reduce((a, x) => a + x.freq, 0);
    assert.ok(Math.abs(sum - 1) < 1e-6, `suma ${sum}`);
    assert.ok(d.spr.value > 0);
  }
});
test('wizard: AA preflop recomienda raise, 72o recomienda fold', () => {
  assert.equal(decideWizard(spot('AhAs', '', true, 'preflop'), 3).recommended, 'raise');
  assert.equal(decideWizard(spot('7h2d', '', true, 'preflop'), 3).recommended, 'fold');
});
test('wizard: set en flop recomienda bet (valor)', () => {
  assert.equal(decideWizard(spot('9d9c', '9h Kd 4c', false, 'flop'), 3).recommended, 'bet');
});
test('datos: 32 escenarios y 16 manos wizard sin colisiones de cartas', () => {
  assert.equal(SCENARIOS.length, 32);
  assert.equal(WIZARD_HANDS.length, 16);
  for (const h of WIZARD_HANDS) {
    const all = [...parseCards(h.hero), ...parseCards(h.river)];
    assert.equal(new Set(all).size, 7, `colision en ${h.id}`);
  }
});
test('solver DCFR real: escenario 0 produce matriz 169 valida', () => {
  const sc = SCENARIOS[0];
  const r = generateCombosStrategy({ potBB: sc.potBB, stackBB: sc.effStackBB, board: parseCards(sc.board), heroLabels: parseRange(sc.heroRange), villainLabels: parseRange(sc.villainRange), heroIP: true, iterations: 120, seed: 11 });
  assert.equal(r.grid.length, 169);
  assert.ok(r.grid.some((g) => g !== null));
  assert.ok(Number.isFinite(r.audit.exploitabilityBB));
  const cell = r.grid.find((g) => g !== null)!;
  const sum = Object.values(cell.actions).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 0.02);
});
test('progreso: error real crea tarjeta SM-2 y fuga; repaso la programa', () => {
  const uid = 'test-wiz-uid';
  const rec = recordDecision(uid, { mode: 'trainer', category: 'srp_ip', street: 'preflop', hero: 'AhAs', board: '', position: 'BTN', action: 'fold', best: 'raise', evLossBB: 0.5, equity: 0.85 });
  assert.equal(rec.isError, true);
  assert.ok(rec.cardId);
  const leaks = getLeaks(uid);
  assert.ok(leaks.some((l) => l.category === 'srp_ip' && l.errors === 1));
  const cards = getErrorCards(uid);
  assert.equal(cards.length, 1);
  const reviewed = reviewErrorCard(uid, rec.cardId!, 5);
  assert.ok(reviewed && reviewed.sm2.reps >= 1);
});
