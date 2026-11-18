import { useMemo, useState } from 'react';
import { Brain, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { WIZARD_HANDS, type WizardHand } from '../data/wizardHands.ts';
import { decideWizard, STREETS, type WizardSpot, type Street } from '../engine/wizard.ts';
import { parseCards, cardStr } from '../engine/cards.ts';
import { parseRange } from '../engine/rangeEquity.ts';
import { recordDecision } from '../lib/progress.ts';
import type { ViewProps } from '../lib/types.ts';
const COLORS: Record<string, string> = { fold: '#ef4444', call: '#f59e0b', raise: '#3B82F6', bet: '#22c55e', check: '#6b7280', open: '#3B82F6', limp: '#a855f7' };
const LABEL: Record<string, string> = { fold: 'Fold', call: 'Call', raise: 'Raise', bet: 'Bet', check: 'Check', open: 'Open', limp: 'Limp' };
interface StepResult { street: string; action: string; best: string; evLossBB: number }
function buildSpot(h: WizardHand, street: Street): WizardSpot {
  const boardStr = street === 'preflop' ? '' : street === 'flop' ? h.flop : street === 'turn' ? h.turn : h.river;
  const heroIP = h.heroPos === 'BTN' || h.heroPos === 'CO';
  return { street, hero: parseCards(h.hero) as [number, number], board: boardStr ? parseCards(boardStr) : [], potBB: h.pots[street], effStackBB: h.stacks[street], heroIP, villainRange: parseRange(h.villainRange), facingBet: h.facing[street], callCostBB: h.callCost[street] };
}
export default function WizardView({ uid }: ViewProps) {
  const [handIdx, setHandIdx] = useState(0);
  const [streetIdx, setStreetIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [done, setDone] = useState(false);
  const hand = WIZARD_HANDS[handIdx];
  const street = STREETS[streetIdx];
  const spot = useMemo(() => buildSpot(hand, street), [hand, street]);
  const decision = useMemo(() => decideWizard(spot, handIdx * 10 + streetIdx + 1), [spot, handIdx, streetIdx]);
  const boardStr = street === 'preflop' ? '' : street === 'flop' ? hand.flop : street === 'turn' ? hand.turn : hand.river;
  const choose = (action: string) => {
    if (chosen) return;
    const chosenA = decision.actions.find((a) => a.action === action);
    const bestA = decision.actions.find((a) => a.action === decision.recommended);
    const maxEv = Math.max(...decision.actions.map((a) => a.evBB));
    const evLoss = Math.max(0, Math.round((maxEv - (chosenA?.evBB ?? 0)) * 100) / 100);
    const rec = recordDecision(uid, { mode: 'wizard', category: street, street, hero: hand.hero, board: boardStr, position: hand.heroPos, action, best: decision.recommended, evLossBB: evLoss, equity: decision.equity });
    setChosen(action);
    setSteps((s) => [...s, { street, action, best: decision.recommended, evLossBB: evLoss }]);
    if (rec.isError) setLastCard(true); else setLastCard(false);
    void bestA;
  };
  const [lastCard, setLastCard] = useState(false);
  const next = () => {
    if (streetIdx < 3) { setStreetIdx(streetIdx + 1); setChosen(null); setLastCard(false); }
    else setDone(true);
  };
  const newHand = () => { setHandIdx((handIdx + 1) % WIZARD_HANDS.length); setStreetIdx(0); setChosen(null); setSteps([]); setDone(false); setLastCard(false); };
  const restart = () => { setStreetIdx(0); setChosen(null); setSteps([]); setDone(false); setLastCard(false); };
  const totalLoss = Math.round(steps.reduce((a, s) => a + s.evLossBB, 0) * 100) / 100;
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Brain size={18} className="text-electric" /> Wizard 4 Fases <span className="text-[10px] font-mono text-neutral-500">Action Gauge · SPR</span></h2>
          <p className="text-sm text-neutral-400">Decide calle a calle. El Action Gauge muestra las frecuencias GTO calculadas con equidad real y lógica SPR.</p>
        </div>
        <select value={handIdx} onChange={(e) => { setHandIdx(Number(e.target.value)); restart(); }} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm max-w-[260px]">
          {WIZARD_HANDS.map((h, i) => <option key={h.id} value={i}>{h.name}</option>)}
        </select>
      </div>
      <div className="flex gap-2">{STREETS.map((s, i) => <div key={s} className={`flex-1 text-center text-xs font-mono py-1.5 rounded border capitalize ${i === streetIdx && !done ? 'border-electric text-electric bg-electric/10' : i < streetIdx || done ? 'border-green-600/40 text-green-500' : 'border-neutral-800 text-neutral-500'}`}>{s}</div>)}</div>
      {!done ? (
        <div className="border border-neutral-900 rounded-lg p-5 bg-neutral-950 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-2xl font-bold text-electric tabular">{hand.hero.match(/../g)?.map((c) => cardStr(parseCards(c)[0])).join(' ')}</span>
            {boardStr && <span className="font-mono text-lg text-white tabular">{boardStr}</span>}
            <span className="text-xs font-mono border border-neutral-800 rounded px-2 py-1">{hand.heroPos} vs {hand.villainPos}</span>
            <span className="text-xs font-mono border border-neutral-800 rounded px-2 py-1 capitalize">{hand.archetype}</span>
            <span className="text-xs font-mono border border-neutral-800 rounded px-2 py-1">Bote {spot.potBB}bb · Stack {spot.effStackBB}bb</span>
            <span className="text-xs font-mono border border-electric/40 text-electric rounded px-2 py-1">SPR {decision.spr.value} · {decision.spr.label}</span>
          </div>
          <div className="text-sm text-neutral-300">{spot.facingBet ? `Enfrentas una apuesta de ${spot.callCostBB}bb. ¿Fold, call o raise?` : street === 'preflop' ? 'Pot sin abrir. ¿Fold, call o raise?' : 'Checked to you. ¿Check o bet?'}</div>
          <div>
            <div className="text-xs uppercase font-mono text-neutral-400 mb-2">Action Gauge · equidad {(decision.equity * 100).toFixed(1)}%</div>
            <div className="flex h-9 rounded-md overflow-hidden border border-neutral-800">
              {decision.actions.map((a) => <div key={a.action} style={{ width: `${a.freq * 100}%`, background: COLORS[a.action] ?? '#3B82F6' }} className="flex items-center justify-center text-[10px] font-mono text-black/80 font-bold" title={`${LABEL[a.action]} ${(a.freq * 100).toFixed(1)}%`}>{a.freq > 0.12 ? `${(a.freq * 100).toFixed(0)}%` : ''}</div>)}
            </div>
            <div className="flex gap-3 mt-2 flex-wrap">{decision.actions.map((a) => <span key={a.action} className="flex items-center gap-1.5 text-xs font-mono"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS[a.action] ?? '#3B82F6' }} />{LABEL[a.action]} <span className="text-neutral-400">{(a.freq * 100).toFixed(1)}%</span></span>)}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {decision.actions.map((a) => (
              <button key={a.action} onClick={() => choose(a.action)} disabled={!!chosen} className={`px-5 py-2.5 rounded-md text-sm font-semibold border transition-colors ${chosen ? (a.action === decision.recommended ? 'border-green-500 text-green-400' : a.action === chosen ? 'border-red-500 text-red-400' : 'border-neutral-800 text-neutral-500') : 'border-neutral-700 hover:border-electric hover:text-electric'}`}>{LABEL[a.action]}</button>
            ))}
          </div>
          {chosen && (
            <div className="border-t border-neutral-900 pt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={chosen === decision.recommended ? 'text-green-400 font-semibold' : 'text-amber-400 font-semibold'}>{chosen === decision.recommended ? '✓ Decisión GTO' : `Tu elección: ${LABEL[chosen]} · GTO: ${LABEL[decision.recommended]}`}</span>
                {lastCard && <span className="flex items-center gap-1 text-xs text-electric"><Sparkles size={13} /> Error añadido a tu mazo SM-2</span>}
              </div>
              <p className="text-neutral-400 text-xs">{decision.rationale}</p>
              <button onClick={next} className="flex items-center gap-1 bg-electric hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-md">{streetIdx < 3 ? 'Siguiente calle' : 'Ver resumen'}<ChevronRight size={15} /></button>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-electric/40 rounded-lg p-5 bg-electric/5 space-y-3">
          <div className="font-bold">Resumen de la mano · {hand.name}</div>
          <div className="text-sm font-mono tabular">Fuga total: <span className={totalLoss > 0.5 ? 'text-red-400' : 'text-green-400'}>{totalLoss} bb</span> · {steps.filter((s) => s.evLossBB > 0.15).length} errores de {steps.length} calles</div>
          <div className="space-y-1 text-xs font-mono">{steps.map((s, i) => <div key={i} className="flex justify-between border border-neutral-900 rounded px-3 py-1.5"><span className="capitalize">{s.street}: {s.action}</span><span className={s.evLossBB > 0.15 ? 'text-red-400' : 'text-green-500'}>{s.evLossBB > 0.15 ? `fuga ${s.evLossBB}bb (GTO ${s.best})` : '✓ GTO'}</span></div>)}</div>
          <div className="flex gap-2"><button onClick={newHand} className="flex items-center gap-1 bg-electric hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-md"><RotateCcw size={14} />Nueva mano</button><button onClick={restart} className="border border-neutral-800 hover:border-electric text-sm px-4 py-2 rounded-md">Repetir mano</button></div>
        </div>
      )}
    </div>
  );
}
