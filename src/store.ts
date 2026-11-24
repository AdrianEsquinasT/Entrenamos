import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session as AuthSession } from '@supabase/supabase-js';
import { DocKey, Row, cloudEnabled, getSpaceId, pullAll, pushDoc, sb, ts } from './cloud';
import type { SetRec } from './program';

export interface Session {
  d: string; // fecha YYYY-MM-DD
  day: number; // 1-4
  b: number; // semana del bloque (6 = descarga)
  x: Record<string, SetRec[]>;
  u: string; // última modificación (resolución de conflictos)
  del?: boolean;
}
export type Log = Record<string, Session>;
export interface Profile { name: string; age: string; weight: string; height: string }
export interface Docs { log: Log; profile: Profile }
export type Status = 'off' | 'local' | 'syncing' | 'ok' | 'error';

const EMPTY_PROFILE: Profile = { name: '', age: '', weight: '', height: '' };
const LS: Record<DocKey, string> = { log: 'entrenamos.log.v1', profile: 'entrenamos.profile.v1' };
const DOCKEYS: DocKey[] = ['log', 'profile'];
const META = 'entrenamos.meta.v1';
const OWNER = 'entrenamos.owner.v1';

const read = <T,>(k: string): T | null => {
  try { const raw = localStorage.getItem(k); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
};
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

export function mergeLogs(a: Log, b: Log): Log {
  const out: Log = { ...a };
  for (const [k, s] of Object.entries(b)) if (!out[k] || ts(s.u) > ts(out[k].u)) out[k] = s;
  return out;
}
const normProfile = (v: unknown): Profile => ({ ...EMPTY_PROFILE, ...((v ?? {}) as Partial<Profile>) });

export function useStore() {
  const [docs, setDocs] = useState<Docs>(() => ({ log: read<Log>(LS.log) ?? {}, profile: normProfile(read<Profile>(LS.profile)) }));
  const docsRef = useRef(docs);
  docsRef.current = docs;
  const metaRef = useRef<Partial<Record<DocKey, string>>>(read(META) ?? {});
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<Status>(cloudEnabled ? 'local' : 'off');
  const [errMsg, setErrMsg] = useState('');
  const [ready, setReady] = useState(!cloudEnabled);
  const timers = useRef<Partial<Record<DocKey, number>>>({});
  const spaceRef = useRef<string | null>(null);
  const sessionRef = useRef<AuthSession | null>(null);
  sessionRef.current = session;

  const setDoc = useCallback(<K extends DocKey>(key: K, value: Docs[K]) => {
    docsRef.current = { ...docsRef.current, [key]: value };
    setDocs(docsRef.current);
  }, []);

  const adopt = useCallback((key: DocKey, value: unknown, updated_at: string) => {
    const v = key === 'profile' ? normProfile(value) : (value ?? {});
    write(LS[key], v);
    metaRef.current = { ...metaRef.current, [key]: updated_at };
    write(META, metaRef.current);
    setDoc(key, v as never);
  }, [setDoc]);

  const push = useCallback(async (key: DocKey) => {
    if (!sessionRef.current || !spaceRef.current) return;
    try {
      setStatus('syncing');
      await pushDoc(spaceRef.current, key, docsRef.current[key], metaRef.current[key] ?? new Date().toISOString());
      setStatus('ok'); setErrMsg('');
    } catch (e) { setStatus('error'); setErrMsg((e as Error).message); }
  }, []);

  const commit = useCallback(<K extends DocKey>(key: K, value: Docs[K]) => {
    const now = new Date().toISOString();
    write(LS[key], value);
    metaRef.current = { ...metaRef.current, [key]: now };
    write(META, metaRef.current);
    setDoc(key, value);
    window.clearTimeout(timers.current[key]);
    timers.current[key] = window.setTimeout(() => push(key), 600);
  }, [push, setDoc]);

  const syncAll = useCallback(async () => {
    if (!sessionRef.current || !spaceRef.current) return;
    const sp = spaceRef.current;
    try {
      setStatus('syncing');
      const rows = await pullAll(sp);
      for (const key of DOCKEYS) {
        const remote = rows.find((r: Row) => r.key === key);
        const cur = docsRef.current[key] as unknown;
        const localHas = Object.values(cur as object).some((v) => Boolean(v)) || (key === 'log' && Object.keys(cur as object).length > 0);
        const lt = ts(metaRef.current[key]);
        const rt = ts(remote?.updated_at);
        if (!remote) {
          if (localHas) await pushDoc(sp, key, cur, metaRef.current[key] ?? new Date().toISOString());
        } else if (key === 'log') {
          const local = docsRef.current.log;
          const rv = (remote.value ?? {}) as Log;
          const merged = mergeLogs(local, rv);
          if (JSON.stringify(merged) !== JSON.stringify(local)) adopt('log', merged, new Date().toISOString());
          if (JSON.stringify(merged) !== JSON.stringify(rv)) await pushDoc(sp, 'log', merged, metaRef.current.log ?? new Date().toISOString());
        } else if (rt > lt) adopt(key, remote.value, remote.updated_at);
        else if (lt > rt && localHas) await pushDoc(sp, key, cur, metaRef.current[key]!);
      }
      setStatus('ok'); setErrMsg('');
    } catch (e) { setStatus('error'); setErrMsg((e as Error).message); }
  }, [adopt]);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); }).catch(() => setReady(true));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sb || !session) { spaceRef.current = null; return; }
    let cancelled = false;
    let cleanup = () => {};
    (async () => {
      try {
        const owner = localStorage.getItem(OWNER);
        if (owner && owner !== session.user.id) {
          (Object.values(LS) as string[]).concat(META).forEach((k) => localStorage.removeItem(k));
          metaRef.current = {};
          docsRef.current = { log: {}, profile: EMPTY_PROFILE };
          setDocs(docsRef.current);
        }
        try { localStorage.setItem(OWNER, session.user.id); } catch { /* */ }
        spaceRef.current = await getSpaceId();
        if (cancelled) return;
        await syncAll();
        const onVis = () => document.visibilityState === 'visible' && syncAll();
        document.addEventListener('visibilitychange', onVis);
        const ch = sb!.channel('app_state_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, (payload) => {
            const row = payload.new as Row | undefined;
            if (!row || !row.key || row.space_id !== spaceRef.current) return;
            if (row.key === 'log') {
              const merged = mergeLogs(docsRef.current.log, (row.value ?? {}) as Log);
              if (JSON.stringify(merged) !== JSON.stringify(docsRef.current.log)) adopt('log', merged, new Date().toISOString());
              if (JSON.stringify(merged) !== JSON.stringify(row.value)) push('log');
            } else if (ts(row.updated_at) > ts(metaRef.current[row.key])) adopt(row.key, row.value, row.updated_at);
          })
          .subscribe();
        cleanup = () => { document.removeEventListener('visibilitychange', onVis); sb!.removeChannel(ch); };
      } catch (e) { setStatus('error'); setErrMsg((e as Error).message); }
    })();
    return () => { cancelled = true; cleanup(); };
  }, [session?.user.id, syncAll, adopt, push]);

  const signIn = async (email: string, password: string) => {
    const { error } = await sb!.auth.signInWithPassword({ email, password });
    return error?.message ?? '';
  };
  const signOut = async () => { await sb!.auth.signOut(); setStatus('local'); };

  return { docs, commit, session, ready, status, errMsg, syncAll, signIn, signOut };
}
export type Store = ReturnType<typeof useStore>;
