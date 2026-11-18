export interface SprResult { value: number; label: string; committed: boolean }
export function calculateSPR(effectiveStackBB: number, potBB: number): SprResult {
  if (potBB <= 0) return { value: Number.POSITIVE_INFINITY, label: 'Sin bote', committed: false };
  const value = effectiveStackBB / potBB;
  const label = value <= 1 ? 'Comprometido' : value <= 3 ? 'Bajo' : value <= 6 ? 'Medio' : value <= 13 ? 'Alto' : 'Profundo';
  return { value: Math.round(value * 100) / 100, label, committed: value <= 1 };
}
