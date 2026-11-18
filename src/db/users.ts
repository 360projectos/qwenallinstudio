import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
export interface UserRow { uid: string; email: string; role: string; plan: string; level: string; createdAt: number }
export interface InviteRow { code: string; email: string; plan: string; used: boolean }
export interface AnnouncementRow { id: string; title: string; body: string; createdAt: number }
export interface TicketRow { id: string; uid: string; subject: string; message: string; status: string; createdAt: number }
export interface BillingRow { id: string; uid: string; amount: number; concept: string; createdAt: number }
interface Store { users: UserRow[]; invites: InviteRow[]; announcements: AnnouncementRow[]; tickets: TicketRow[]; billing: BillingRow[] }
const rid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const SNAP = join(process.cwd(), '.data', 'store.json');
function load(): Store {
  try { if (existsSync(SNAP)) return JSON.parse(readFileSync(SNAP, 'utf8')) as Store; } catch { /* ignore */ }
  return { users: [], invites: [], announcements: [], tickets: [], billing: [] };
}
function save(s: Store): void {
  try { mkdirSync(join(process.cwd(), '.data'), { recursive: true }); writeFileSync(SNAP, JSON.stringify(s)); } catch { /* ignore */ }
}
class MemoryRepo {
  kind = 'memory';
  private s: Store = load();
  private persist(): void { save(this.s); }
  async getUser(uid: string): Promise<UserRow | undefined> { return this.s.users.find((u) => u.uid === uid); }
  async upsertUser(uid: string, email: string): Promise<UserRow> {
    let u = this.s.users.find((x) => x.uid === uid);
    if (!u) { u = { uid, email, role: 'user', plan: 'free', level: 'recreational', createdAt: Date.now() }; this.s.users.push(u); this.persist(); }
    return u;
  }
  async listUsers(): Promise<UserRow[]> { return this.s.users; }
  async setPlan(uid: string, plan: string): Promise<UserRow | undefined> { const u = await this.getUser(uid); if (u) { u.plan = plan; this.persist(); } return u; }
  async createInvite(email: string, plan: string): Promise<InviteRow> { const i = { code: rid(), email, plan, used: false }; this.s.invites.push(i); this.persist(); return i; }
  async listAnnouncements(): Promise<AnnouncementRow[]> { return this.s.announcements; }
  async createAnnouncement(title: string, body: string): Promise<AnnouncementRow> { const a = { id: rid(), title, body, createdAt: Date.now() }; this.s.announcements.push(a); this.persist(); return a; }
  async createTicket(uid: string, subject: string, message: string): Promise<TicketRow> { const t = { id: rid(), uid, subject, message, status: 'open', createdAt: Date.now() }; this.s.tickets.push(t); this.persist(); return t; }
  async listTickets(): Promise<TicketRow[]> { return this.s.tickets; }
  async addBilling(uid: string, amount: number, concept: string): Promise<BillingRow> { const b = { id: rid(), uid, amount, concept, createdAt: Date.now() }; this.s.billing.push(b); this.persist(); return b; }
  async kpis(): Promise<Record<string, number>> {
    return { users: this.s.users.length, pro: this.s.users.filter((u) => u.plan === 'pro').length, elite: this.s.users.filter((u) => u.plan === 'elite').length, openTickets: this.s.tickets.filter((t) => t.status === 'open').length, revenue: this.s.billing.reduce((a, b) => a + b.amount, 0), invites: this.s.invites.length };
  }
}
export const repo = new MemoryRepo();
