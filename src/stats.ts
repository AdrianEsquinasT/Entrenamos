import { EX, SetRec, e1rm } from './program';
import type { Log, Session } from './store';

export const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fromISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = fromISO(s); d.setDate(d.getDate() + n); return toISO(d); };
export const fmtShort = (s: string) => fromISO(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

export const keyOf = (d: string, day: number) => `${d}_${day}`;
export const liveSessions = (log: Log): [string, Session][] =>
  Object.entries(log).filter(([, s]) => !s.del).sort((a, b) => (a[1].d === b[1].d ? a[1].u.localeCompare(b[1].u) : a[1].d.localeCompare(b[1].d)));

export interface Point { d: string; key: string; deload: boolean; sets: SetRec[]; e1: number; top: number; vol: number; best: SetRec }

/** Historial de un ejercicio (orden cronológico) */
export function history(log: Log, exId: string): Point[] {
  const out: Point[] = [];
  for (const [key, s] of liveSessions(log)) {
    const sets = s.x[exId];
    if (!sets || !sets.length) continue;
    const best = sets.reduce((a, b) => (e1rm(b[0], b[1]) > e1rm(a[0], a[1]) || (e1rm(a[0], a[1]) === 0 && b[1] > a[1]) ? b : a));
    out.push({ d: s.d, key, deload: s.b === 6, sets, e1: Math.max(...sets.map((x) => e1rm(x[0], x[1]))), top: Math.max(...sets.map((x) => x[0])), vol: sets.reduce((a, x) => a + x[0] * x[1], 0), best });
  }
  return out;
}

/** Última sesión previa (no descarga) con ese ejercicio, sin contar la sesión `exclude` */
export function lastBefore(log: Log, exId: string, date: string, exclude: string): Point | undefined {
  const h = history(log, exId).filter((p) => !p.deload && p.key !== exclude && p.d <= date);
  return h[h.length - 1];
}

export const pctChange = (h: Point[]) => {
  const w = h.filter((p) => !p.deload && p.e1 > 0);
  if (w.length < 2) return null;
  return ((w[w.length - 1].e1 - w[0].e1) / w[0].e1) * 100;
};

export const exName = (id: string) => EX[id]?.name ?? id;
