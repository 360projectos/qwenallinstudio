import { useState } from 'react';
import { Sigma, Lock, Play } from 'lucide-react';
import { evaluate7CardHand, parseCards } from '../engine/cards.ts';
import { monteCarloEquity } from '../engine/rangeEquity.ts';
import { solveMatrixGame } from '../engine/dcfr.ts';
import { malmuthHarville } from '../engine/icm.ts';
import type { ViewProps } from '../lib/types.ts';
interface Bench { name: string; ms: number; detail: string }
export default function MathDocsView(_vp: ViewProps) {
  const [benches, setBenches] = useState<Bench[]>([]);
  const [running, setRunning] = useState(false);
  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const out: Bench[] = [];
      let t0 = performance.now();
      const seven = parseCards('As Ks Qs Js Ts 2d 3c');
      for (let i = 0; i < 3000; i++) evaluate7CardHand(seven);
      out.push({ name: 'Evaluador 7 cartas ×3000', ms: performance.now() - t0, detail: '21 subconjuntos de 5 · exacto' });
      t0 = performance.now();
      const eq = monteCarloEquity('AA', 'KK', '', 2000, 7);
      out.push({ name: 'Monte Carlo AA vs KK ×2000', ms: performance.now() - t0, detail: `Hero ${eq.heroPct}% · Villano ${eq.villainPct}%` });
      t0 = performance.now();
      const nash = solveMatrixGame([[1, -1], [-1, 1]], 2000);
      out.push({ name: 'DCFR matching pennies ×2000', ms: performance.now() - t0, detail: `fila [${nash.row.map((x) => x.toFixed(2)).join(', ')}] · valor ${nash.value.toFixed(4)}` });
      t0 = performance.now();
      const icm = malmuthHarville([5000, 3000, 2000], [50, 30, 20]);
      out.push({ name: 'ICM Malmuth-Harville', ms: performance.now() - t0, detail: icm.map((x) => x.toFixed(2)).join(' / ') });
      setBenches(out); setRunning(false);
    }, 30);
  };
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Sigma size={18} className="text-electric" /> Math & Docs</h2>
        <p className="text-sm text-neutral-400">Documentación matemática, auditoría de nodos DCFR y benchmarks en vivo.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950 space-y-2 text-sm">
          <div className="text-xs uppercase font-mono text-neutral-400">Fundamentos</div>
          <p className="text-xs text-neutral-300"><span className="text-electric font-mono">DCFR</span> — descuentos α=1.5, β=0, γ=2: regret positivo ×t^α/(t^α+1), negativo ×0.5, estrategia ×(t/(t+1))^γ.</p>
          <p className="text-xs text-neutral-300"><span className="text-electric font-mono">ICM</span> — Malmuth-Harville recursivo exacto con memoización por subconjuntos.</p>
          <p className="text-xs text-neutral-300"><span className="text-electric font-mono">Equidad</span> — Monte Carlo sobre baraja real de 52 cartas, evaluador exacto de 7.</p>
          <p className="text-xs text-neutral-300"><span className="text-electric font-mono">SM-2</span> — EF' = EF + 0.1 − (5−q)(0.08 + (5−q)·0.02), intervalos 1→6→EF·prev.</p>
        </div>
        <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase font-mono text-neutral-400">Benchmarks en vivo</div>
            <button onClick={run} disabled={running} className="flex items-center gap-1 bg-electric hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-md"><Play size={13} />{running ? '…' : 'Ejecutar'}</button>
          </div>
          {benches.length === 0 ? <div className="text-neutral-600 text-sm py-6 text-center">Ejecuta los benchmarks del motor.</div> : (
            <div className="space-y-2 font-mono tabular text-xs">
              {benches.map((b) => <div key={b.name} className="border border-neutral-900 rounded p-2"><div className="flex justify-between"><span className="text-neutral-300">{b.name}</span><span className="text-electric">{b.ms.toFixed(1)} ms</span></div><div className="text-neutral-500">{b.detail}</div></div>)}
            </div>
          )}
        </div>
      </div>
      <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold"><Lock size={15} /> Consola SaaS Admin · acceso restringido</div>
        <p className="text-xs text-neutral-400 mt-2">Zero-Trust: la consola (KPIs, usuarios/planes, invitaciones, facturación manual, anuncios globales y tickets) solo es visible para <span className="font-mono">rataparicio@gmail.com</span> / <span className="font-mono">360aparicio@gmail.com</span> o rol admin verificado en backend. En esta demo pública el panel está bloqueado; las rutas <span className="font-mono">/api/admin/*</span> responden 401/403 server-side.</p>
      </div>
    </div>
  );
}
