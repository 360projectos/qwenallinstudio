import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createPublicKey, verify as cryptoVerify, createHmac } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repo } from './src/db/users.ts';
import { buildRoadmap } from './src/lib/roadmap.ts';
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 8080);
const IS_PROD = process.env.NODE_ENV === 'production';
const ADMIN_EMAILS = new Set(['rataparicio@gmail.com', '360aparicio@gmail.com']);
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? '';
const DEV_SECRET = process.env.LAB_DEV_SECRET ?? '';
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '30mb' }));
interface Claims { sub: string; email?: string; aud?: string; iss?: string; exp?: number; iat?: number }
let jwksCache: { keys: Record<string, unknown>[]; at: number } | null = null;
async function getJwks(): Promise<Record<string, unknown>[]> {
  if (jwksCache && Date.now() - jwksCache.at < 3600000) return jwksCache.keys;
  const r = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  const j = (await r.json()) as { keys: Record<string, unknown>[] };
  jwksCache = { keys: j.keys, at: Date.now() };
  return j.keys;
}
const b64url = (s: string): Buffer => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
async function verifyFirebase(token: string): Promise<Claims | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const header = JSON.parse(b64url(h).toString()) as { kid?: string; alg?: string };
    if (header.alg !== 'RS256' || !header.kid) return null;
    const keys = await getJwks();
    const jwk = keys.find((k) => k['kid'] === header.kid);
    if (!jwk) return null;
    const key = createPublicKey({ key: jwk, format: 'jwk' } as Parameters<typeof createPublicKey>[0]);
    const ok = cryptoVerify('RSA-SHA256', Buffer.from(`${h}.${p}`), key, b64url(s));
    if (!ok) return null;
    const c = JSON.parse(b64url(p).toString()) as Claims;
    const now = Math.floor(Date.now() / 1000);
    if (c.aud !== FIREBASE_PROJECT_ID) return null;
    if (c.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
    if (!c.sub || (c.exp ?? 0) < now || (c.iat ?? 0) > now + 300) return null;
    return c;
  } catch { return null; }
}
function verifyDev(token: string): Claims | null {
  if (IS_PROD || !DEV_SECRET) return null;
  const parts = token.split(':');
  if (parts.length !== 3 || parts[0] !== 'dev') return null;
  const email = parts[1];
  const sig = createHmac('sha256', DEV_SECRET).update(email).digest('hex');
  if (sig !== parts[2]) return null;
  return { sub: `dev-${email}`, email };
}
export interface AuthedRequest extends Request { auth?: Claims }
async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const hdr = req.headers.authorization ?? '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
  if (!token) { res.status(401).json({ error: 'unauthorized' }); return; }
  const claims = (await verifyFirebase(token)) ?? verifyDev(token);
  if (!claims) { res.status(401).json({ error: 'invalid_token' }); return; }
  req.auth = claims; next();
}
function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  void requireAuth(req, res, async () => {
    const email = (req.auth?.email ?? '').toLowerCase();
    const user = await repo.getUser(req.auth!.sub);
    const role = user?.role ?? 'user';
    if (ADMIN_EMAILS.has(email) || role === 'admin' || role === 'superadmin') { next(); return; }
    res.status(403).json({ error: 'forbidden' });
  });
}
app.get('/api/health', (_req, res) => { res.status(200).json({ ok: true, service: 'lab-studio', version: '4.0.1', node: process.version, mode: IS_PROD ? 'production' : 'development', store: repo.kind }); });
app.get('/api/announcements', async (_req, res) => { res.json(await repo.listAnnouncements()); });
app.get('/api/me', requireAuth, async (req: AuthedRequest, res) => {
  const email = (req.auth?.email ?? '').toLowerCase();
  const u = await repo.upsertUser(req.auth!.sub, email);
  const isAdmin = ADMIN_EMAILS.has(email) || u.role === 'admin' || u.role === 'superadmin';
  res.json({ uid: req.auth!.sub, email, role: isAdmin ? 'admin' : u.role, plan: u.plan, level: u.level });
});
app.post('/api/tickets', requireAuth, async (req: AuthedRequest, res) => {
  const t = await repo.createTicket(req.auth!.sub, String(req.body?.subject ?? ''), String(req.body?.message ?? ''));
  res.status(201).json(t);
});
app.post('/api/gemini/roadmap', requireAuth, async (req: AuthedRequest, res) => {
  const level = String(req.body?.level ?? 'recreational');
  const fallback = buildRoadmap(level);
  const apiKey = process.env.GEMINI_API_KEY ?? '';
  if (!apiKey) { res.json({ source: 'fallback', roadmap: fallback }); return; }
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const r = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Genera un roadmap NLHE 6-max para nivel ${level}. JSON.` });
    res.json({ source: 'gemini', roadmap: fallback, note: r.text?.slice(0, 400) });
  } catch { res.json({ source: 'fallback', roadmap: fallback }); }
});
app.get('/api/admin/kpis', requireAdmin, async (_req, res) => { res.json(await repo.kpis()); });
app.get('/api/admin/users', requireAdmin, async (_req, res) => { res.json(await repo.listUsers()); });
app.post('/api/admin/users/:uid/plan', requireAdmin, async (req, res) => { res.json(await repo.setPlan(String(req.params.uid), String(req.body?.plan ?? 'free'))); });
app.post('/api/admin/invites', requireAdmin, async (req, res) => { res.status(201).json(await repo.createInvite(String(req.body?.email ?? ''), String(req.body?.plan ?? 'pro'))); });
app.post('/api/admin/announcements', requireAdmin, async (req, res) => { res.status(201).json(await repo.createAnnouncement(String(req.body?.title ?? ''), String(req.body?.body ?? ''))); });
app.get('/api/admin/tickets', requireAdmin, async (_req, res) => { res.json(await repo.listTickets()); });
app.post('/api/admin/billing', requireAdmin, async (req, res) => { res.status(201).json(await repo.addBilling(String(req.body?.uid ?? ''), Number(req.body?.amount ?? 0), String(req.body?.concept ?? ''))); });
const dist = join(__dirname, 'dist');
if (IS_PROD && existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) { res.status(200).sendFile(join(dist, 'index.html')); return; }
    next();
  });
} else if (!IS_PROD) {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.use((_req, res) => { res.status(404).json({ error: 'not_found' }); });
app.listen(PORT, () => { console.log(`[lab-studio] :${PORT} · ${IS_PROD ? 'production' : 'development'} · store=${repo.kind}`); });
