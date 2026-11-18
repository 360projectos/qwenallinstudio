const PREFIX = (uid: string): string => `__u_${uid}`;
export function userKey(uid: string, key: string): string { return `${PREFIX(uid)}:${key}`; }
export function loadUser<T>(uid: string, key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try { const raw = localStorage.getItem(userKey(uid, key)); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
export function saveUser<T>(uid: string, key: string, value: T): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(userKey(uid, key), JSON.stringify(value)); } catch { /* quota */ }
}
export function clearUser(uid: string): void {
  if (typeof localStorage === 'undefined') return;
  const p = PREFIX(uid);
  for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.startsWith(p)) localStorage.removeItem(k); }
}
export interface Profile { plan: 'free' | 'pro' | 'elite'; level: 'newbie' | 'recreational' | 'regular' | 'pro'; xp: number; onboarded: boolean }
export const cleanProfile = (): Profile => ({ plan: 'free', level: 'recreational', xp: 0, onboarded: false });
export function loadProfile(uid: string): Profile { return loadUser<Profile>(uid, 'profile', cleanProfile()); }
export function saveProfile(uid: string, p: Profile): void { saveUser(uid, 'profile', p); }
