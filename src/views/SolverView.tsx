import { useMemo, useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { SCENARIOS } from '../data/scenarios.ts';
import { parseCards } from '../engine/cards.ts';
import { parseRange } from '../engine/rangeEquity.ts';
import { generateCombosStrategy, type DcfrResult } from '../engine/dcfr.ts';
import { calculateSPR } from '../engine/spr.ts';
import { Matrix13 } from '../components/Matrix13.tsx';
import type { ViewProps } from '../lib/types.ts';
const heat = (t: number): string => { const x = Math.max(0, Math.min(1, t)); return `rgb(${Math.round(18 + 41 * x)},${Math.round(18 + 112 * x)},${Math.round(18 + 228 * x)})`; };
export default function SolverView(_vp: ViewProps) {
  const [scId, setScId] = useState(SCENARIOS[0].id);
  const [result, setResult] = useState<DcfrResult | null>(null);
  const [running, setRunning] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const sc = useMemo(() => SCENARIOS.find((s) => s.id === scId) ?? SCENARIOS[0], [scId]);
  const spr = calculateSPR(sc.effStackBB, sc.potBB);
  const run = () => {
    setRunning(true); setResult(null); setSel(null);
    setTimeout(() => {
      try {
        const heroIP = sc.heroPos === 'BTN' || sc.heroPos === 'CO';
        const r = generateCombosStrategy({ potBB: sc.potBB, stackBB: sc.effStackBB, board: parseCards(sc.board), heroLabels: parseRange(sc.heroRange), villainLabels: parseRange(sc.villainRange), heroIP, iterations: 200, seed: 11 });
        setResult(r);
      } catch (e) { console.error(e); }
      setRunning(false);
    }, 30);
  };
  const cellOf = (label: string) => result?.grid.find((g) => g && g.label === label) ?? null;
  const selCell = sel ? cellOf(sel) : null;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">Asistente & Solver <span className="text-[10px] font-mono text-neutral-500">DCFR · 169 manos</span></h2>
        <p className="text-sm text-neutral-400">Selecciona un escenario, ejecuta el solver Discounted CFR y explora la matriz 13×13 de frecuencias y EV.</p>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Escenario
          <select value={scId} onChange={(e) => setScId(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white min-w-[240px]">
            {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <button onClick={run} disabled={running} className="flex items-center gap-2 bg-electric hover:bg-blue-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md text-sm">
          {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}{running ? 'Resolviendo…' : 'Resolver'}
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950 space-y-2 text-sm">
          <div className="text-neutral-400 text-xs uppercase font-mono">Spot</div>
          <div>{sc.description}</div>
          <div className="grid grid-cols-2 gap-2 font-mono tabular text-xs text-neutral-300">
            <div>Hero: <span className="text-electric">{sc.hero}</span></div>
            <div>Board: <span className="text-white">{sc.board}</span></div>
            <div>Bote: {sc.potBB} bb</div>
            <div>Stack eff: {sc.effStackBB} bb</div>
            <div>SPR: <span className="text-electric">{spr.value}</span> ({spr.label})</div>
            <div>{sc.heroPos} vs {sc.villainPos} · {sc.archetype}</div>
          </div>
          {result && (
            <div className="pt-2 border-t border-neutral-900 text-xs font-mono tabular text-neutral-400 space-y-1">
              <div>Iteraciones: {result.audit.iterations} · Infosets: {result.audit.infosets} · Nodos: {result.audit.treeNodes}</div>
              <div>Exploitability: <span className="text-electric">{result.audit.exploitabilityBB.toFixed(3)} bb</span> · EV perfil: {result.audit.profileValueBB.toFixed(3)} bb</div>
            </div>
          )}
        </div>
        <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950">
          <div className="text-neutral-400 text-xs uppercase font-mono mb-3">Matriz 13×13 · color = equidad</div>
          {result ? (
            <Matrix13 getCell={(label) => { const c = cellOf(label); if (!c) return { bg: '#0a0a0a', text: '·' }; return { bg: heat(c.equity), text: label, title: `${label} · eq ${(c.equity * 100).toFixed(1)}% · EV ${c.ev}bb` }; }} onCell={setSel} />
          ) : <div className="text-neutral-600 text-sm py-10 text-center">{running ? 'Calculando frecuencias y EVs…' : 'Pulsa Resolver para generar la estrategia.'}</div>}
        </div>
      </div>
      {selCell && (
        <div className="border border-electric/40 rounded-lg p-4 bg-electric/5 text-sm">
          <div className="font-mono font-bold text-electric mb-2">{selCell.label} <span className="text-neutral-400 font-normal">· {selCell.combos} combos · equidad {(selCell.equity * 100).toFixed(1)}% · EV {selCell.ev} bb</span></div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selCell.actions).map(([a, f]) => (
              <span key={a} className="font-mono tabular text-xs border border-neutral-800 rounded px-2 py-1">{a}: <span className="text-electric">{(f * 100).toFixed(1)}%</span></span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
