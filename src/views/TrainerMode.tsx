import { useState } from 'react';
import { Dumbbell, RefreshCw, Stethoscope, Activity, History } from 'lucide-react';
import { generateSpot, evaluateDecision, runDiagnostic, TRAINER_CATEGORIES, POSITIONS, ARCHETYPE_LABEL, type TrainerSpot, type DecisionEval, type LeakReport, type TrainerCategory, type Position } from '../engine/handSimulator.ts';
import { planConfigs, todayKey } from '../lib/plans.ts';
import { loadUser, saveUser } from '../lib/userStorage.ts';
import { recordDecision, getLeaks, getHistory, totalEvLoss } from '../lib/progress.ts';
import type { ViewProps } from '../lib/types.ts';
export default function TrainerMode({ uid, plan }: ViewProps) {
  const [cat, setCat] = useState<TrainerCategory>('auto');
  const [pos, setPos] = useState<Position | 'any'>('any');
  const [spot, setSpot] = useState<TrainerSpot | null>(null);
  const [feedback, setFeedback] = useState<DecisionEval | null>(null);
  const [count, setCount] = useState<number>(() => loadUser<number>(uid, todayKey(), 0));
  const [diag, setDiag] = useState<LeakReport | null>(null);
  const [tick, setTick] = useState(0);
  const [showHist, setShowHist] = useState(false);
  const limit = planConfigs[plan].dailyHandLimit;
  const leaks = getLeaks(uid);
  const history = getHistory(uid);
  const totalLoss = totalEvLoss(uid);
  const newHand = () => { if (count >= limit) return; setSpot(generateSpot(Math.floor(Math.random() * 1e9), cat, pos === 'any' ? undefined : pos)); setFeedback(null); };
  const choose = (action: string) => {
    if (!spot || feedback) return;
    const ev = evaluateDecision(spot, action, Math.floor(Math.random() * 1e6));
    setFeedback(ev);
    const nc = count + 1; setCount(nc); saveUser(uid, todayKey(), nc);
    recordDecision(uid, { mode: 'trainer', category: spot.category, street: 'preflop', hero: spot.heroStr, board: '', position: spot.position, action, best: ev.best, evLossBB: ev.evLossBB, equity: ev.equity });
    setTick(tick + 1);
  };
  const runDiag = () => { setDiag(runDiagnostic(Math.floor(Math.random() * 1e6), 100, cat).report); };
  void tick;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Dumbbell size={18} className="text-electric" /> Entrenador Pro <span className="text-[10px] font-mono text-neutral-500">6-Max · tiempo real</span></h2>
        <p className="text-sm text-neutral-400">Cada decisión alimenta tu perfil de fugas y tu mazo SM-2. Límite diario: <span className="text-electric font-mono">{count}/{limit}</span>.</p>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Categoría<select value={cat} onChange={(e) => setCat(e.target.value as TrainerCategory)} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm">{TRAINER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Posición<select value={pos} onChange={(e) => setPos(e.target.value as Position | 'any')} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"><option value="any">any</option>{POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
        <button onClick={newHand} disabled={count >= limit} className="flex items-center gap-2 bg-electric hover:bg-blue-600 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-md text-sm"><RefreshCw size={15} />Nueva mano</button>
        <button onClick={runDiag} className="flex items-center gap-2 border border-neutral-800 hover:border-electric px-4 py-2 rounded-md text-sm"><Stethoscope size={15} />Diagnóstico 100 manos</button>
        <button onClick={() => setShowHist(!showHist)} className="flex items-center gap-2 border border-neutral-800 hover:border-electric px-4 py-2 rounded-md text-sm"><History size={15} />Historial ({history.length})</button>
      </div>
      {count >= limit && <div className="text-amber-400 text-sm border border-amber-500/30 rounded-md p-3">Límite diario del plan {plan} alcanzado.</div>}
      {spot && (
        <div className="border border-neutral-900 rounded-lg p-5 bg-neutral-950 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-2xl font-bold text-electric tabular">{spot.heroStr}</span>
            <span className="text-xs font-mono border border-neutral-800 rounded px-2 py-1">{spot.position} vs {spot.villainPos}</span>
            <span className="text-xs font-mono border border-neutral-800 rounded px-2 py-1">{spot.category}</span>
            <span className="text-xs font-mono border border-neutral-800 rounded px-2 py-1">SPR {spot.sprValue} · {spot.sprLabel}</span>
            <span className="text-xs text-neutral-500">{ARCHETYPE_LABEL[spot.archetype]}</span>
          </div>
          <p className="text-sm text-neutral-300">{spot.situation}</p>
          <div className="flex gap-2 flex-wrap">{spot.options.map((o) => <button key={o} onClick={() => choose(o)} disabled={!!feedback} className={`px-4 py-2 rounded-md text-sm font-semibold border transition-colors ${feedback ? (o === feedback.best ? 'border-green-500 text-green-400' : o === feedback.action ? 'border-red-500 text-red-400' : 'border-neutral-800 text-neutral-500') : 'border-neutral-700 hover:border-electric hover:text-electric'}`}>{o}</button>)}</div>
          {feedback && (
            <div className="text-sm font-mono tabular border-t border-neutral-900 pt-3 space-y-1">
              <div>Tu elección: <span className="text-white">{feedback.action}</span> · EV {feedback.evBB} bb · equidad {(feedback.equity * 100).toFixed(1)}%</div>
              <div>Óptima: <span className="text-green-400">{feedback.best}</span> · Fuga EV: <span className={feedback.evLossBB > 0.2 ? 'text-red-400' : 'text-neutral-400'}>{feedback.evLossBB} bb</span>{feedback.evLossBB > 0.15 && <span className="text-electric text-xs"> · añadido a tu mazo SM-2</span>}</div>
            </div>
          )}
        </div>
      )}
      <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950">
        <div className="flex items-center gap-2 text-sm font-bold mb-3"><Activity size={15} className="text-electric" /> Perfil de fugas en tiempo real <span className="text-xs font-mono text-neutral-500">· fuga total {totalLoss} bb · {history.length} manos</span></div>
        {leaks.length === 0 ? <div className="text-neutral-600 text-sm">Juega manos para construir tu perfil de fugas por categoría.</div> : (
          <div className="space-y-1">{leaks.slice(0, 8).map((l) => (
            <div key={l.category} className="flex items-center justify-between text-xs font-mono tabular border border-neutral-900 rounded px-3 py-2">
              <span>{l.category} · {l.hands} manos · {l.errors} errores</span>
              <span className={l.severity === 'alta' ? 'text-red-400' : l.severity === 'media' ? 'text-amber-400' : l.severity === 'baja' ? 'text-yellow-200' : 'text-green-500'}>{l.avgEvLossBB} bb/mano · {l.severity}</span>
            </div>))}</div>
        )}
      </div>
      {showHist && (
        <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950">
          <div className="text-sm font-bold mb-2">Historial de manos</div>
          {history.length === 0 ? <div className="text-neutral-600 text-sm">Sin manos aún.</div> : (
            <div className="space-y-1 max-h-64 overflow-y-auto">{history.slice(0, 30).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-xs font-mono tabular border border-neutral-900 rounded px-3 py-1.5">
                <span>{h.hero} · {h.category} · {h.position} · {h.action}</span>
                <span className={h.evLossBB > 0.15 ? 'text-red-400' : 'text-green-500'}>{h.evLossBB > 0.15 ? `fuga ${h.evLossBB}bb` : '✓ GTO'}</span>
              </div>))}</div>
          )}
        </div>
      )}
      {diag && (
        <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950 space-y-2">
          <div className="font-bold text-sm">Diagnóstico · perfil: <span className="text-electric">{diag.profile}</span> · fuga total {diag.totalEvLossBB} bb</div>
          {diag.leaks.slice(0, 5).map((l) => <div key={l.category} className="flex items-center justify-between text-xs font-mono tabular border border-neutral-900 rounded px-3 py-2"><span>{l.category} · {l.hands} manos</span><span className={l.severity === 'alta' ? 'text-red-400' : l.severity === 'media' ? 'text-amber-400' : 'text-neutral-400'}>{l.avgLossBB} bb/mano · {l.severity}</span></div>)}
          <div className="text-xs text-neutral-400 pt-1">{diag.plan.map((p, i) => <div key={i}>• {p}</div>)}</div>
        </div>
      )}
    </div>
  );
}
