import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { malmuthHarville, simulateVariance, type VarianceResult } from '../engine/icm.ts';
import type { ViewProps } from '../lib/types.ts';
const nums = (s: string): number[] => s.split(/[\s,]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0);
function IcmPanel() {
  const [stacks, setStacks] = useState('5000,3000,2000');
  const [payouts, setPayouts] = useState('50,30,20');
  const [eq, setEq] = useState<number[] | null>(null);
  const [err, setErr] = useState('');
  const calc = () => { try { setEq(malmuthHarville(nums(stacks), nums(payouts))); setErr(''); } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setEq(null); } };
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Stacks<input value={stacks} onChange={(e) => setStacks(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" /></label>
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Premios<input value={payouts} onChange={(e) => setPayouts(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" /></label>
      </div>
      <button onClick={calc} className="bg-electric hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md text-sm">Calcular ICM</button>
      {err && <div className="text-red-400 text-sm">{err}</div>}
      {eq && <div className="space-y-1 font-mono tabular text-sm">{eq.map((e, i) => <div key={i} className="flex justify-between border border-neutral-900 rounded px-3 py-2"><span>Jugador {i + 1}</span><span className="text-electric">{e.toFixed(3)}</span></div>)}</div>}
    </div>
  );
}
function VariancePanel() {
  const [wr, setWr] = useState(5); const [sd, setSd] = useState(80); const [hands, setHands] = useState(500);
  const [r, setR] = useState<VarianceResult | null>(null);
  const run = () => setR(simulateVariance({ winrateBB100: wr, sdBB100: sd, handsPerSession: hands, sessions: 2000, seed: 42 }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Winrate bb/100<input type="number" value={wr} onChange={(e) => setWr(Number(e.target.value))} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" /></label>
        <label className="text-xs text-neutral-400 flex flex-col gap-1">SD bb/100<input type="number" value={sd} onChange={(e) => setSd(Number(e.target.value))} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" /></label>
        <label className="text-xs text-neutral-400 flex flex-col gap-1">Manos/sesión<input type="number" value={hands} onChange={(e) => setHands(Number(e.target.value))} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" /></label>
      </div>
      <button onClick={run} className="bg-electric hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md text-sm">Simular 2000 sesiones</button>
      {r && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono tabular text-xs">
          {[['Media', r.meanBB], ['P5', r.p5], ['P50', r.p50], ['P95', r.p95], ['% sesión perdida', r.probLosingSession], ['Max DD (bb)', r.maxDrawdownBB], ['Racha perdedora', r.longestLosingStreak], ['Sesiones', r.sessions]].map(([k, v]) => (
            <div key={String(k)} className="border border-neutral-900 rounded p-2"><div className="text-neutral-500">{k}</div><div className="text-electric text-base">{v}</div></div>
          ))}
        </div>
      )}
    </div>
  );
}
function HudPanel() {
  const [vpip, setVpip] = useState(24); const [pfr, setPfr] = useState(20); const [threebet, setThreebet] = useState(8); const [af, setAf] = useState(2.5);
  const profile = vpip < 18 ? 'Nit' : vpip > 35 ? (pfr > 30 ? 'Maniac' : 'Fish') : pfr > 26 ? 'LAG' : 'TAG';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="text-xs text-neutral-400 flex flex-col gap-1">VPIP %<input type="number" value={vpip} onChange={(e) => setVpip(Number(e.target.value))} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" /></label>
        <label className="text-xs text-neutral-400 flex flex-col gap-1">PFR %<input type="number" value={pfr} onChange={(e) => setPfr(Number(e.target.value))} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" /></label>
        <label className="text-xs text-neutral-400 flex flex-col gap-1">3bet %<input type="number" value={threebet} onChange={(e) => setThreebet(Number(e.target.value))} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" /></label>
        <label className="text-xs text-neutral-400 flex flex-col gap-1">AF<input type="number" step="0.1" value={af} onChange={(e) => setAf(Number(e.target.value))} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" /></label>
      </div>
      <div className="border border-electric/40 rounded-lg p-4 bg-electric/5">
        <div className="text-xs text-neutral-400 font-mono">Arquetipo detectado</div>
        <div className="text-2xl font-bold text-electric">{profile}</div>
        <div className="text-xs text-neutral-400 mt-1">3bet {threebet}% · AF {af} · {profile === 'Nit' ? 'Explota: roba ciegas, cbet frecuente.' : profile === 'Fish' ? 'Explota: value bet fino, no farolees.' : profile === 'Maniac' ? 'Explota: bluffcatch y trap.' : profile === 'LAG' ? 'Explota: 4bet value y call down ligero.' : 'Juego sólido: busca spots de presión.'}</div>
      </div>
    </div>
  );
}
function ImportPanel() {
  const [text, setText] = useState('');
  const hands = (text.match(/PokerStars Hand|Hand #|GGPoker|Winamax/gi) ?? []).length;
  const lines = text.split('\n').filter((l) => /dealt|flop|turn|river/i.test(l)).length;
  return (
    <div className="space-y-3">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Pega aquí tu historial de manos (PokerStars / GG / Winamax)…" className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-xs font-mono" />
      <div className="grid grid-cols-2 gap-2 font-mono tabular text-xs">
        <div className="border border-neutral-900 rounded p-3"><div className="text-neutral-500">Manos detectadas</div><div className="text-electric text-xl">{hands}</div></div>
        <div className="border border-neutral-900 rounded p-3"><div className="text-neutral-500">Líneas de acción</div><div className="text-electric text-xl">{lines}</div></div>
      </div>
      <p className="text-[11px] text-neutral-500">El importador multi-sala y la analítica PT4 Pro (VPIP/PFR/3bet/AF/Cbet, fugas &gt;5% EV y entrenamiento en 1 clic) se conectan a esta base por UID.</p>
    </div>
  );
}
export default function ToolsView(_vp: ViewProps) {
  const [tab, setTab] = useState<'icm' | 'var' | 'hud' | 'import'>('icm');
  const tabs = [['icm', 'ICM'], ['var', 'Varianza'], ['hud', 'HUD Profiler'], ['import', 'Importador HH']] as const;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Wrench size={18} className="text-electric" /> Herramientas Pro</h2>
        <p className="text-sm text-neutral-400">ICM Malmuth-Harville exacto, varianza Monte Carlo, perfilador HUD e importador de manos.</p>
      </div>
      <div className="flex gap-1 flex-wrap">{tabs.map(([id, name]) => <button key={id} onClick={() => setTab(id)} className={`px-3 py-1.5 rounded-md text-sm border ${tab === id ? 'border-electric text-electric bg-electric/10' : 'border-neutral-800 text-neutral-400 hover:text-white'}`}>{name}</button>)}</div>
      <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950">
        {tab === 'icm' && <IcmPanel />}
        {tab === 'var' && <VariancePanel />}
        {tab === 'hud' && <HudPanel />}
        {tab === 'import' && <ImportPanel />}
      </div>
    </div>
  );
}
