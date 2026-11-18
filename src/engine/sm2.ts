export interface Sm2Card { ef: number; interval: number; reps: number }
export interface Sm2Result extends Sm2Card { dueInDays: number }
export function newSm2Card(): Sm2Card { return { ef: 2.5, interval: 0, reps: 0 }; }
export function sm2(card: Sm2Card, quality: number): Sm2Result {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const ef = Math.max(1.3, card.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  if (q < 3) return { ef, interval: 1, reps: 0, dueInDays: 1 };
  const reps = card.reps + 1;
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(card.interval * ef);
  return { ef, interval, reps, dueInDays: interval };
}
