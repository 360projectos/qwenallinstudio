export type Plan = 'free' | 'pro' | 'elite';
export type Level = 'newbie' | 'recreational' | 'regular' | 'pro';
export interface PlanConfig { dailyHandLimit: number; lockedSections: string[]; hiddenSections: string[] }
export const planConfigs: Record<Plan, PlanConfig> = {
  free: { dailyHandLimit: 50, lockedSections: ['tools', 'mathdocs'], hiddenSections: [] },
  pro: { dailyHandLimit: 500, lockedSections: [], hiddenSections: [] },
  elite: { dailyHandLimit: 5000, lockedSections: [], hiddenSections: [] },
};
export const PILLARS = [
  { id: 'solver', name: 'Asistente & Solver' },
  { id: 'trainer', name: 'Entrenador Pro' },
  { id: 'ranges', name: 'Rangos & Equidad' },
  { id: 'tools', name: 'Herramientas Pro' },
  { id: 'academy', name: 'Academia Cognitiva' },
  { id: 'mathdocs', name: 'Math & Docs' },
] as const;
export function todayKey(): string { return `trainer:${new Date().toISOString().slice(0, 10)}`; }
