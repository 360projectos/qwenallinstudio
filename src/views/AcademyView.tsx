import { useMemo, useState } from 'react';
import { GraduationCap, Clock, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { scaleLinear } from 'd3-scale';
import { line, area, curveMonotoneX } from 'd3-shape';
import { ACADEMY_CATEGORIES, ACADEMY_SPOTS } from '../data/academySpots.ts';
import { CATEGORY_NAMES } from '../engine/cards.ts';
import { sm2, newSm2Card, type Sm2Card } from '../engine/sm2.ts';
import { loadUser, saveUser } from '../lib/userStorage.ts';
import { getErrorCards, getDueErrorCards, reviewErrorCard } from '../lib/progress.ts';
import type { ViewProps } from '../lib/types.ts';
interface Hist { t: number; score: number }
export default function AcademyView({ uid }: ViewProps) {
  const [tab, setTab] = useState<'nivel0' | 'eval' | 'errors' | 'progress'>('nivel0');
  const [cat, setCat] = useState('all');
  const [noClock, setNoClock] = useState(true);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [cards, setCards] = useState<Record<string, Sm2Card>>(() => loadUser<Record<string, Sm2Card>>(uid, 'sm2', {}));
  const [hist, setHist] = useState<Hist[]>(() => loadUser<Hist[]>(uid, 'academy_hist', []));
  const [tick, setTick] = useState(0);
  const [revealed, setRevealed] = useState<string | null>(null);
  const spots = useMemo(() => ACADEMY_SPOTS.filter((s) => cat === 'all' || s.category === cat), [cat]);
  const spot = spots[idx % spots.length];
  const correctCount = hist.filter((h) => h.score === 1).length;
  const errorCards = getErrorCards(uid);
  const dueCards = getDueErrorCards(uid);
  const answer = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    const ok = i === spot.correct;
    const prev = cards[spot.id] ?? newSm2Card();
    const next = sm2(prev, ok ? 5 : 2);
    const nc = { ...cards, [spot.id]: next }; setCards(nc); saveUser(uid, 'sm2', nc);
    const nh = [...hist, { t: hist.length + 1, score: ok ? 1 : 0 }]; setHist(nh); saveUser(uid, 'academy_hist', nh);
  };
  const nextSpot = () => { setChosen(null); setIdx((idx + 1) % spots.length); };
  const grade = (id: string, q: number) => { reviewErrorCard(uid, id, q); setRevealed(null); setTick(tick + 1); };
  void tick;
  const W = 560, H = 160;
  const x = scaleLinear().domain([0, Math.max(1, hist.length)]).range([0, W]);
  const y = scaleLinear().domain([0, 1]).range([H, 0]);
  const running = hist.map((h, i) => ({ t: i + 1, score: hist.slice(0, i + 1).filter((z) => z.score === 1).length / (i + 1) }));
  const ln = line<{ t: number; score: number }>().x((d) => x(d.t)).y((d) => y(d.score)).curve(curveMonotoneX);
  const ar = area<{ t: number; score: number }>().x((d) => x(d.t)).y0(H).y1((d) => y(d.score)).curve(curveMonotoneX);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><GraduationCap size={18} className="text-electric" /> Academia Cognitiva</h2>
        <p className="text-sm text-neutral-400">Nivel 0, evaluación SM-2 y mazo adaptativo sincronizado con tus errores reales del Wizard y el Entrenador.</p>
      </div>
      <div className="flex gap-1 flex-wrap">
        {([['nivel0', 'Nivel 0'], ['eval', 'Evaluación SM-2'], ['errors', `Mis Errores (${dueCards.length} hoy)`], ['progress', 'Progreso']] as const).map(([id, name]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-3 py-1.5 rounded-md text-sm border ${tab === id ? 'border-electric text-electric bg-electric/10' : 'border-neutral-800 text-neutral-400 hover:text-white'}`}>{name}</button>
        ))}
      </div>
      {tab === 'nivel0' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950">
            <div className="text-xs uppercase font-mono text-neutral-400 mb-2">Ranking de manos (mayor a menor)</div>
            <ol className="space-y-1 text-sm">{[...CATEGORY_NAMES].reverse().map((n, i) => <li key={n} className="flex gap-2"><span className="text-electric font-mono">{i + 1}.</span>{n}</li>)}</ol>
          </div>
          <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950 space-y-2 text-sm">
            <div className="text-xs uppercase font-mono text-neutral-400 mb-2">Posiciones 6-Max</div>
            <p><span className="text-electric font-mono">UTG / MP</span> — tempranas, rango tight.</p>
            <p><span className="text-electric font-mono">CO / BTN</span> — tardías, rango amplio (posicion).</p>
            <p><span className="text-electric font-mono">SB / BB</span> — ciegas, defienden con pot odds.</p>
            <p className="text-neutral-400 text-xs pt-2">Práctica sin presión: usa Evaluación con "Sin Reloj" activado.</p>
          </div>
        </div>
      )}
      {tab === 'eval' && spot && (
        <div className="border border-neutral-900 rounded-lg p-5 bg-neutral-950 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={cat} onChange={(e) => { setCat(e.target.value); setIdx(0); setChosen(null); }} className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 text-xs">
              <option value="all">Todas las categorías</option>{ACADEMY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setNoClock(!noClock)} className={`flex items-center gap-1 text-xs border rounded-md px-3 py-1.5 ${noClock ? 'border-electric text-electric' : 'border-neutral-800 text-neutral-400'}`}><Clock size={13} />Sin Reloj {noClock ? 'ON' : 'OFF'}</button>
            <span className="text-xs font-mono text-neutral-500">dominio {correctCount}/{hist.length}</span>
          </div>
          <div className="text-sm font-semibold">{spot.question}</div>
          <div className="grid gap-2">{spot.options.map((o, i) => <button key={i} onClick={() => answer(i)} disabled={chosen !== null} className={`text-left text-sm border rounded-md px-3 py-2 transition-colors ${chosen === null ? 'border-neutral-800 hover:border-electric' : i === spot.correct ? 'border-green-500 text-green-400' : i === chosen ? 'border-red-500 text-red-400' : 'border-neutral-900 text-neutral-500'}`}>{o}</button>)}</div>
          {chosen !== null && (
            <div className="text-sm border-t border-neutral-900 pt-3 space-y-2">
              <div className="flex items-center gap-2">{chosen === spot.correct ? <CheckCircle2 size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}<span>{chosen === spot.correct ? 'Correcto' : 'Incorrecto'}</span></div>
              <p className="text-neutral-400 text-xs">{spot.explanation}</p>
              <button onClick={nextSpot} className="bg-electric hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-md">Siguiente</button>
            </div>
          )}
        </div>
      )}
      {tab === 'errors' && (
        <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold"><Sparkles size={15} className="text-electric" /> Mazo adaptativo · {errorCards.length} tarjetas de tus errores reales · {dueCards.length} para hoy</div>
          {errorCards.length === 0 ? <div className="text-neutral-600 text-sm py-6 text-center">Comete errores en el Wizard o el Entrenador y aparecerán aquí como tarjetas SM-2 para repasar.</div> : (
            <div className="space-y-2">{errorCards.slice(0, 20).map((c) => (
              <div key={c.id} className="border border-neutral-900 rounded-md p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-mono text-neutral-400 capitalize">{c.category} · {c.street} · EF {c.sm2.ef.toFixed(2)} · {c.sm2.reps} reps</span>
                  <span className={`text-[10px] font-mono ${c.dueAt <= Date.now() ? 'text-electric' : 'text-neutral-600'}`}>{c.dueAt <= Date.now() ? 'PARA HOY' : `en ${Math.ceil((c.dueAt - Date.now()) / 86400000)}d`}</span>
                </div>
                <div className="text-sm mt-1">{c.prompt}</div>
                {revealed === c.id ? (
                  <div className="mt-2 space-y-2">
                    <div className="text-xs text-green-400">Óptimo: {c.correctAction}</div>
                    <div className="flex gap-2"><button onClick={() => grade(c.id, 1)} className="text-xs border border-red-500/50 text-red-400 rounded px-3 py-1.5">Otra vez</button><button onClick={() => grade(c.id, 4)} className="text-xs border border-amber-500/50 text-amber-400 rounded px-3 py-1.5">Bien</button><button onClick={() => grade(c.id, 5)} className="text-xs border border-green-500/50 text-green-400 rounded px-3 py-1.5">Fácil</button></div>
                  </div>
                ) : <button onClick={() => setRevealed(c.id)} className="mt-2 text-xs bg-electric hover:bg-blue-600 text-white rounded px-3 py-1.5">Mostrar respuesta</button>}
              </div>))}</div>
          )}
        </div>
      )}
      {tab === 'progress' && (
        <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-950">
          <div className="text-xs uppercase font-mono text-neutral-400 mb-2">Dominio histórico (D3.js) · {hist.length} respuestas</div>
          {hist.length === 0 ? <div className="text-neutral-600 text-sm py-8 text-center">Responde preguntas en Evaluación para generar tu curva de dominio.</div> : (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[560px]"><path d={ar(running) ?? ''} fill="#3B82F6" opacity={0.15} /><path d={ln(running) ?? ''} fill="none" stroke="#3B82F6" strokeWidth={2} /></svg>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs font-mono tabular">
            {ACADEMY_CATEGORIES.slice(0, 8).map((c) => { const done = Object.keys(cards).filter((k) => k.startsWith(c.id)).length; return <div key={c.id} className="border border-neutral-900 rounded p-2"><div className="text-neutral-500 truncate">{c.name}</div><div className="text-electric">{done} cards</div></div>; })}
          </div>
        </div>
      )}
    </div>
  );
}
