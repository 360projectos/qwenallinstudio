export interface RoadmapStep { stage: string; focus: string; drills: string[]; milestone: string }
export function buildRoadmap(level: string): RoadmapStep[] {
  const base: RoadmapStep[] = [
    { stage: 'NL02', focus: 'Fundamentos: rangos RFI, posiciones y SPR', drills: ['Academia Nivel 0', 'RFI por posicion', '50 manos srp_ip'], milestone: 'VPIP 18-24 / PFR 15-20' },
    { stage: 'NL05', focus: 'Defensa BB, cbet IP y texturas', drills: ['BB defend vs BTN', 'cbet_ip 100 manos', 'Monte Carlo equidad'], milestone: 'Fold-to-cbet < 55%' },
    { stage: 'NL10', focus: '3bet pots, squeeze y turn barrels', drills: ['3bet_ip/oop', 'sqz', 'turn barrel selectivo'], milestone: '3bet 7-10%' },
    { stage: 'NL25', focus: 'Explotacion por arquetipo y bluffcatch', drills: ['HudProfiler', 'river bluffcatch', 'vs maniac'], milestone: 'Winrate > 4 bb/100' },
    { stage: 'NL50', focus: 'ICM, varianza y juego multiway', drills: ['IcmVarianceSimulator', 'multiway 3-way', '4bet pots'], milestone: 'Sample 50k manos' },
    { stage: 'NL100', focus: 'GTO avanzado DCFR y auditoria de nodos', drills: ['SolverView 169 manos', 'BenchmarksView', 'diagnostico 100 manos'], milestone: 'Exploitability < 1.5 bb' },
  ];
  const start = level === 'newbie' ? 0 : level === 'recreational' ? 1 : level === 'regular' ? 2 : 3;
  return base.slice(start);
}
