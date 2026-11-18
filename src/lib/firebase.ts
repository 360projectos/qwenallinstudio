import { initializeApp, type FirebaseApp } from '@firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, type Auth } from '@firebase/auth';
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};
export const isDemo = !cfg.apiKey || import.meta.env.VITE_DEMO_MODE === '1';
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
if (!isDemo && cfg.apiKey) { app = initializeApp(cfg); auth = getAuth(app); }
export interface Session { uid: string; email: string }
export const DEMO_SESSION: Session = { uid: 'demo-user', email: 'demo@labstudio.dev' };
export async function loginGoogle(): Promise<Session> {
  if (isDemo || !auth) return DEMO_SESSION;
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    return { uid: cred.user.uid, email: cred.user.email ?? '' };
  } catch {
    await signInWithRedirect(auth, new GoogleAuthProvider());
    return DEMO_SESSION;
  }
}
export async function resolveRedirect(): Promise<Session | null> {
  if (isDemo || !auth) return null;
  const r = await getRedirectResult(auth);
  return r ? { uid: r.user.uid, email: r.user.email ?? '' } : null;
}
export const ADMIN_EMAILS = ['rataparicio@gmail.com', '360aparicio@gmail.com'];
export const isAdminEmail = (email: string): boolean => ADMIN_EMAILS.includes(email.toLowerCase());
