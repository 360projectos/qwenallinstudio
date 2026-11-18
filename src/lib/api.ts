const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
export async function apiGet<T>(path: string, token?: string): Promise<T | null> {
  try {
    const r = await fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}
export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T | null> {
  try {
    const r = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}
