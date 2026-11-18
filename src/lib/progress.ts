// Progreso integrado por UID: historial de manos, perfil de fugas en tiempo real y mazo SM-2 sincronizado con errores reales
import { loadUser, saveUser } from './userStorage.ts';
import { sm2, newSm2Card, type Sm2Card } from '../engine/sm2.ts';
export interface HandRecord { id: string; ts: number; mode: 'wizard' | 'trainer'; category: string; street: string; hero: string; board: string; position: string; action: string; best: string; evLossBB: number; equity: number }
export interface ErrorCard { id: string; category: string; street: string; hero: string; board: string; prompt: string; correctAction: string; chosen: string; sm2: Sm2Card; dueAt: number; createdAt: number }
export interface LeakStat { category: string; hands: number; errors: number; totalEvLossBB: number; avgEvLossBB: number; severity: 'alta' | 'media' | 'baja' | 'ok' }
interface ProgressState { hands: HandRecord[]; errors: ErrorCard[] }
const KEY = 'progress_v1';
const load = (uid: string): ProgressState => loadUser<ProgressState>(uid, KEY, { hands: [], errors: [] });
const save = (uid: string, s: ProgressState): void => saveUser(uid, KEY, s);
const ERROR_THRESHOLD = 0.15;
export function recordDecision(uid: string, rec: Omit<HandRecord, 'id' | 'ts'>): { isError: boolean; cardId?: string } {
  const s = load(uid);
  const id = `h${Date.now()}${Math.floor(Math.random() * 1e4)}`;
  const hand: HandRecord = { ...rec, id, ts: Date.now() };
  s.hands = [hand, ...s.hands].slice(0, 500);
  let cardId: string | undefined;
  const isError = rec.evLossBB > ERROR_THRESHOLD;
  if (isError) {
    const key = `${rec.category}|${rec.street}|${rec.hero}`;
    let card = s.errors.find((c) => c.id === key);
    const prompt = `${rec.hero}${rec.board ? ' en ' + rec.board : ''} (${rec.street}, ${rec.position}): elegiste ${rec.action}, optimo ${rec.best}. Fuga ${rec.evLossBB} bb.`;
    if (!card) {
      card = { id: key, category: rec.category, street: rec.street, hero: rec.hero, board: rec.board, prompt, correctAction: rec.best, chosen: rec.action, sm2: newSm2Card(), dueAt: Date.now(), createdAt: Date.now() };
      s.errors.push(card);
    } else { card.prompt = prompt; card.chosen = rec.action; }
    const r1 = sm2(card.sm2, 1);
    card.sm2 = r1;
    card.dueAt = Date.now() + r1.dueInDays * 86400000;
    cardId = key;
  }
  save(uid, s);
  return { isError, cardId };
}
export function getHistory(uid: string): HandRecord[] { return load(uid).hands; }
export function getLeaks(uid: string): LeakStat[] {
  const hands = load(uid).hands;
  const byCat = new Map<string, HandRecord[]>();
  for (const h of hands) { const arr = byCat.get(h.category) ?? []; arr.push(h); byCat.set(h.category, arr); }
  const out: LeakStat[] = [...byCat.entries()].map(([category, arr]) => {
    const errors = arr.filter((h) => h.evLossBB > ERROR_THRESHOLD).length;
    const total = arr.reduce((a, h) => a + h.evLossBB, 0);
    const avg = total / arr.length;
    const severity: LeakStat['severity'] = avg > 0.5 ? 'alta' : avg > 0.2 ? 'media' : avg > ERROR_THRESHOLD ? 'baja' : 'ok';
    return { category, hands: arr.length, errors, totalEvLossBB: Math.round(total * 100) / 100, avgEvLossBB: Math.round(avg * 100) / 100, severity };
  });
  return out.sort((a, b) => b.totalEvLossBB - a.totalEvLossBB);
}
export function getErrorCards(uid: string): ErrorCard[] { return load(uid).errors.slice().sort((a, b) => a.dueAt - b.dueAt); }
export function getDueErrorCards(uid: string): ErrorCard[] { return getErrorCards(uid).filter((c) => c.dueAt <= Date.now()); }
export function reviewErrorCard(uid: string, id: string, quality: number): ErrorCard | undefined {
  const s = load(uid);
  const card = s.errors.find((c) => c.id === id);
  if (!card) return undefined;
  const rq = sm2(card.sm2, quality);
  card.sm2 = rq;
  card.dueAt = Date.now() + rq.dueInDays * 86400000;
  save(uid, s);
  return card;
}
export function totalEvLoss(uid: string): number { return Math.round(load(uid).hands.reduce((a, h) => a + h.evLossBB, 0) * 100) / 100; }
export function resetProgress(uid: string): void { save(uid, { hands: [], errors: [] }); }
