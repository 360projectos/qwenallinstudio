import { useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { monteCarloEquity, type EquityResult } from '../engine/rangeEquity.ts';
import type { ViewProps } from '../lib/types.ts';
const PRESETS: Record<string, string> = {
  'BTN Open': '22+,A2s+,K2s+,Q4s+,J6s+,T6s+,95s+,85s+,75s+,64s+,54s,A2o+,K8o+,Q9o+,J9o+,T9o',
  'CO Open': '22+,A2s+,K9s+,Q9s+,J9s+,T8s+,97s+,87s,76s,65s,ATo+,KJo+,QJo',
  'BB Defend': '22+,A2s+,K2s+,Q2s+,J4s+,T5s+,95s+,85s+,75s+,64s+,53s+,43s,A2o+,K5o+,Q8o+,J8o+,T8o+,98o',
  'UTG Open': '22+,ATs+,KJs+,QJs,JTs,T9s,98s,AQo+,KQo',
  'Value 3bet': 'TT+,AQs+,AKo',
};
export default function RangeEquityCalculator(_vp: ViewProps) {
  const [hero, setHero] = useState('AA');
  const [villain, setVillain] = useState('KK');
  const [board, setBoard] = useState('');
  const [iters, setIters] = useState(3000);
  const [res, setRes] = useState<EquityResult | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState('');
  const run = () => {
    setRunning(true); setErr('');
    setTimeout(() => {
      try { setRes(monteCarloEquity(hero, villain, board, iters, 7)); }
      catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setRes(null); }
      setRunning(false);
    }, 30);
  };
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Calculator size={18} className="text-electric" /> Rangos & Equidad <span className="text-[10px] font-mono text-neutral-500">Monte Carlo · 52 cartas</span></h2>
        <p className="text-sm text-neutral-400">Editor de rangos + calculadora Monte Carlo real con evaluador exacto de 7 cartas.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Rango Hero
          <textarea value={hero} onChange={(e) => setHero(e.target.value)} rows={3} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono text-white" />
          <span className="flex gap-1 flex-wrap">{Object.keys(PRESETS).map((k) => <button key={k} onClick={() => setHero(PRESETS[k])} className="text-[10px] border border-neutral-800 hover:border-electric rounded px-2 py-0.5">{k}</button>)}</span>
        </label>
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Rango Villano
          <textarea value={villain} onChange={(e) => setVillain(e.target.value)} rows={3} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono text-white" />
          <span className="flex gap-1 flex-wrap">{Object.keys(PRESETS).map((k) => <button key={k} onClick={() => setVillain(PRESETS[k])} className="text-[10px] border border-neutral-800 hover:border-electric rounded px-2 py-0.5">{k}</button>)}</span>
        </label>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Board (opcional)
          <input value={board} onChange={(e) => setBoard(e.target.value)} placeholder="Kh 7d 2c" className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono w-40" />
        </label>
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Iteraciones
          <select value={iters} onChange={(e) => setIters(Number(e.target.value))} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm">
            {[1000, 3000, 10000].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button onClick={run} disabled={running} className="flex items-center gap-2 bg-electric hover:bg-blue-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md text-sm">{running ? <Loader2 size={15} className="animate-spin" /> : <Calculator size={15} />}Calcular</button>
      </div>
      {err && <div className="text-red-400 text-sm border border-red-500/30 rounded-md p-3">{err}</div>}
      {res && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950">
            <div className="text-xs uppercase font-mono text-neutral-400 mb-3">Equidad · {res.iterations} iteraciones</div>
            <div className="space-y-2 font-mono tabular">
              <div className="flex justify-between"><span className="text-electric">Hero</span><span className="text-2xl font-bold text-electric">{res.heroPct}%</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Villano</span><span className="text-2xl font-bold">{res.villainPct}%</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Empate</span><span>{res.tiePct}%</span></div>
            </div>
            <div className="mt-3 h-3 rounded-full overflow-hidden flex bg-neutral-900">
              <div style={{ width: `${res.heroPct}%` }} className="bg-electric" />
              <div style={{ width: `${res.tiePct}%` }} className="bg-neutral-600" />
              <div style={{ width: `${res.villainPct}%` }} className="bg-neutral-800" />
            </div>
          </div>
          <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950">
            <div className="text-xs uppercase font-mono text-neutral-400 mb-3">Impacto en board (Hero)</div>
            <div className="space-y-1 text-xs font-mono tabular">
              {res.boardImpact.map((b) => (
                <div key={b.name} className="flex justify-between"><span className="text-neutral-300">{b.name}</span><span className="text-electric">{b.pct}%</span></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
