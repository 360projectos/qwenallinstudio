import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCard, evaluate7CardHand, combosForLabels, ALL_169 } from '../src/engine/cards.ts';
import { calculateSPR } from '../src/engine/spr.ts';
import { sm2, newSm2Card } from '../src/engine/sm2.ts';
import { malmuthHarville, simulateVariance } from '../src/engine/icm.ts';
import { monteCarloEquity } from '../src/engine/rangeEquity.ts';
import { solveMatrixGame, solveDCFRSubgame } from '../src/engine/dcfr.ts';
import { runDiagnostic, generateSpot, evaluateDecision } from '../src/engine/handSimulator.ts';
const P = (s: string) => parseCard(s);
test('evaluador 7 cartas: escalera de color gana a poker y detecta wheel', () => {
  const sf = evaluate7CardHand(['As','Ks','Qs','Js','Ts','2d','3c'].map(P));
  const quads = evaluate7CardHand(['As','Ah','Ad','Ac','Ks','Kd','2c'].map(P));
  const wheel = evaluate7CardHand(['As','2d','3c','4h','5s','9d','Tc'].map(P));
  assert.equal(sf.name, 'Escalera de color');
  assert.ok(sf.score > quads.score);
  assert.equal(quads.name, 'Poker');
  assert.equal(wheel.name, 'Escalera');
});
test('169 manos y combos preflop', () => {
  assert.equal(ALL_169.length, 169);
  assert.equal(combosForLabels(['AA'], new Set()).length, 6);
  assert.equal(combosForLabels(['AKs'], new Set()).length, 4);
  assert.equal(combosForLabels(['AKo'], new Set()).length, 12);
});
test('Monte Carlo AA vs KK ~81%', () => {
  const r = monteCarloEquity('AA', 'KK', '', 4000, 7);
  assert.ok(r.heroPct >= 78 && r.heroPct <= 84, `hero=${r.heroPct}`);
  assert.ok(Math.abs(r.heroPct + r.villainPct + r.tiePct - 100) < 0.5);
});
test('SPR tipado value/label', () => {
  assert.deepEqual(calculateSPR(100, 10), { value: 10, label: 'Alto', committed: false });
  assert.equal(calculateSPR(5, 10).label, 'Comprometido');
  assert.equal(calculateSPR(5, 10).committed, true);
});
test('SM-2 intervalos 1,6 y crecimiento EF', () => {
  let c = newSm2Card();
  c = sm2(c, 5); assert.equal(c.interval, 1);
  c = sm2(c, 5); assert.equal(c.interval, 6);
  c = sm2(c, 5); assert.ok(c.interval > 6);
  const fail = sm2(c, 1); assert.equal(fail.reps, 0); assert.equal(fail.interval, 1);
});
test('ICM Malmuth-Harville: stacks iguales y conservacion', () => {
  const eq = malmuthHarville([1000, 1000, 1000], [50, 30, 20]);
  for (const e of eq) assert.ok(Math.abs(e - 100 / 3) < 1e-6);
  const eq2 = malmuthHarville([5000, 3000, 2000], [50, 30, 20]);
  assert.ok(Math.abs(eq2.reduce((a, b) => a + b, 0) - 100) < 1e-6);
  assert.ok(eq2[0] > eq2[1] && eq2[1] > eq2[2]);
});
test('ICM vs fuerza bruta (3 jugadores)', () => {
  const stacks = [5000, 3000, 2000]; const payouts = [50, 30, 20];
  const mh = malmuthHarville(stacks, payouts);
  const perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  const bf = [0, 0, 0];
  for (const perm of perms) {
    let prob = 1; const remaining = new Set([0, 1, 2]);
    for (const who of perm) { const s = [...remaining].reduce((a, j) => a + stacks[j], 0); prob *= stacks[who] / s; remaining.delete(who); }
    perm.forEach((who, pos) => { if (pos < payouts.length) bf[who] += prob * payouts[pos]; });
  }
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(mh[i] - bf[i]) < 1e-6);
});
test('varianza Monte Carlo determinista con seed', () => {
  const a = simulateVariance({ winrateBB100: 5, sdBB100: 80, handsPerSession: 500, sessions: 2000, seed: 42 });
  const b = simulateVariance({ winrateBB100: 5, sdBB100: 80, handsPerSession: 500, sessions: 2000, seed: 42 });
  assert.deepEqual(a, b);
  assert.equal(a.sessions, 2000);
});
test('DCFR matching pennies converge a Nash (0.5,0.5) valor 0', () => {
  const s = solveMatrixGame([[1, -1], [-1, 1]], 3000);
  assert.ok(Math.abs(s.row[0] - 0.5) < 0.03);
  assert.ok(Math.abs(s.col[0] - 0.5) < 0.03);
  assert.ok(Math.abs(s.value) < 0.03);
});
test('DCFR subgame: frecuencias suman 1 y auditoria finita', () => {
  const board = ['As','Kd','7c','2h','9s'].map(P);
  const r = solveDCFRSubgame({ potBB: 10, stackBB: 100, board, heroLabels: ['AA','KK','AKs','76s'], villainLabels: ['QQ','JJ','TT','AQo'], heroIP: false, iterations: 200, seed: 11 });
  for (const key of Object.keys(r.bucketStrategies)) {
    const sum = Object.values(r.bucketStrategies[key]).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 0.02, `${key} suma ${sum}`);
  }
  assert.ok(Number.isFinite(r.audit.exploitabilityBB));
  assert.ok(r.audit.treeNodes > 0);
});
test('trainer: spot generado y decision evaluada', () => {
  const spot = generateSpot(123, 'call', 'BB');
  assert.equal(spot.position, 'BB');
  const ev = evaluateDecision(spot, 'call', 99);
  assert.ok(Number.isFinite(ev.evBB));
  assert.ok(ev.evLossBB >= 0);
});
test('diagnostico 100 manos produce reporte de fugas', () => {
  const { results, report } = runDiagnostic(7, 100, 'auto');
  assert.equal(results.length, 100);
  assert.ok(typeof report.profile === 'string');
  assert.ok(report.plan.length > 0);
});
