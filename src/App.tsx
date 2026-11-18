import { Suspense, lazy, useEffect, useState } from 'react';
import { Brain, Dumbbell, Grid3X3, Wrench, GraduationCap, Sigma, Spade } from 'lucide-react';
import { PILLARS, type Plan, type Level } from './lib/plans.ts';
import { DEMO_SESSION, isDemo, isAdminEmail, loginGoogle, resolveRedirect, type Session } from './lib/firebase.ts';
import { loadProfile, saveProfile } from './lib/userStorage.ts';
import type { ViewProps } from './lib/types.ts';
const AssistantView = lazy(() => import('./views/AssistantView.tsx'));
const TrainerMode = lazy(() => import('./views/TrainerMode.tsx'));
const RangeEquityCalculator = lazy(() => import('./views/RangeEquityCalculator.tsx'));
const ToolsView = lazy(() => import('./views/ToolsView.tsx'));
const AcademyView = lazy(() => import('./views/AcademyView.tsx'));
const MathDocsView = lazy(() => import('./views/MathDocsView.tsx'));
const ICONS: Record<string, typeof Brain> = { solver: Brain, trainer: Dumbbell, ranges: Grid3X3, tools: Wrench, academy: GraduationCap, mathdocs: Sigma };
const LEVELS: Level[] = ['newbie', 'recreational', 'regular', 'pro'];
export default function App() {
  const [session, setSession] = useState<Session>(DEMO_SESSION);
  const [pillar, setPillar] = useState<string>('solver');
  const [plan, setPlan] = useState<Plan>('elite');
  const [level, setLevel] = useState<Level>('recreational');
  const [onboarded, setOnboarded] = useState(true);
  useEffect(() => {
    void resolveRedirect().then((s) => { if (s) setSession(s); });
    const p = loadProfile(session.uid);
    setPlan(isDemo ? 'elite' : p.plan); setLevel(p.level); setOnboarded(p.onboarded || isDemo);
  }, [session.uid]);
  const vp: ViewProps = { uid: session.uid, plan, level };
  const chooseLevel = (l: Level) => { setLevel(l); setOnboarded(true); saveProfile(session.uid, { plan, level: l, xp: 0, onboarded: true }); };
  if (!onboarded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-neutral-800 rounded-lg p-8 bg-neutral-950">
          <div className="flex items-center gap-2 text-electric mb-4"><Spade size={22} /><span className="font-bold text-lg">Lab Studio</span></div>
          <h1 className="text-xl font-bold mb-2">Bienvenido a God of Poker</h1>
          <p className="text-neutral-400 text-sm mb-6">Selecciona tu nivel de experiencia para personalizar tu roadmap.</p>
          <div className="grid grid-cols-2 gap-3">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => chooseLevel(l)} className="border border-neutral-800 hover:border-electric rounded-md p-4 text-left capitalize transition-colors">
                <span className="font-semibold">{l}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-900 bg-black/90 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-electric font-extrabold tracking-tight"><Spade size={20} /><span>LAB STUDIO</span><span className="text-[10px] text-neutral-500 font-mono">v4.1.0</span></div>
          <nav className="flex gap-1 flex-wrap">
            {PILLARS.map((p) => { const Icon = ICONS[p.id]; const active = pillar === p.id; return (
              <button key={p.id} onClick={() => setPillar(p.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors border ${active ? 'border-electric text-electric bg-electric/10' : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-800'}`}>
                <Icon size={15} /><span className="hidden md:inline">{p.name}</span>
              </button> ); })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <select value={level} onChange={(e) => chooseLevel(e.target.value as Level)} className="bg-neutral-950 border border-neutral-800 rounded-md text-xs px-2 py-1.5 text-neutral-300">
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <span className="text-[10px] font-mono uppercase px-2 py-1 rounded border border-electric/40 text-electric">{plan}</span>
            {isAdminEmail(session.email) && <span className="text-[10px] font-mono text-amber-400">ADMIN</span>}
            {!isDemo && <button onClick={() => void loginGoogle().then(setSession)} className="text-xs border border-neutral-800 rounded-md px-3 py-1.5 hover:border-electric">Login</button>}
            {isDemo && <span className="text-[10px] font-mono text-neutral-500">DEMO</span>}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Suspense fallback={<div className="text-neutral-500 text-sm animate-pulse">Cargando modulo…</div>}>
          {pillar === 'solver' && <AssistantView {...vp} />}
          {pillar === 'trainer' && <TrainerMode {...vp} />}
          {pillar === 'ranges' && <RangeEquityCalculator {...vp} />}
          {pillar === 'tools' && <ToolsView {...vp} />}
          {pillar === 'academy' && <AcademyView {...vp} />}
          {pillar === 'mathdocs' && <MathDocsView {...vp} />}
        </Suspense>
      </main>
      <footer className="border-t border-neutral-900 py-3 text-center text-[11px] text-neutral-600 font-mono">Lab Studio v4.1.0 · God of Poker · NLHE 6-Max · GTO / Explotativo</footer>
    </div>
  );
}
