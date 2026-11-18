import { useState } from 'react';
import WizardView from './WizardView.tsx';
import SolverView from './SolverView.tsx';
import type { ViewProps } from '../lib/types.ts';
export default function AssistantView(vp: ViewProps) {
  const [tab, setTab] = useState<'wizard' | 'dcfr'>('wizard');
  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        <button onClick={() => setTab('wizard')} className={`px-4 py-2 rounded-md text-sm font-semibold border ${tab === 'wizard' ? 'border-electric text-electric bg-electric/10' : 'border-neutral-800 text-neutral-400 hover:text-white'}`}>Wizard 4 Fases</button>
        <button onClick={() => setTab('dcfr')} className={`px-4 py-2 rounded-md text-sm font-semibold border ${tab === 'dcfr' ? 'border-electric text-electric bg-electric/10' : 'border-neutral-800 text-neutral-400 hover:text-white'}`}>Laboratorio DCFR · 32 escenarios</button>
      </div>
      {tab === 'wizard' ? <WizardView {...vp} /> : <SolverView {...vp} />}
    </div>
  );
}
