import { useEffect, useMemo, useState } from 'react';
import { DAYS, EX, Slot, blockWeek, estMinutes, fmtKg, isDeload, rirFor, setsFor, suggest, SetRec } from './program';
import { Session, Store } from './store';
import { addDays, fmtShort, keyOf, lastBefore, liveSessions, toISO } from './stats';

type Edit = { w?: string; r?: string };
const num = (s: string | undefined) => { const n = parseFloat((s ?? '').replace(',', '.')); return Number.isFinite(n) ? n : NaN; };

function Ring({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 78, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 200 200" className="ring" aria-label={`${pct}% completado`}>
      <circle cx="100" cy="100" r={r} className="ring-bg" />
      <circle cx="100" cy="100" r={r} className="ring-fg" stroke={color} strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 100 100)" />
      <text x="100" y="104" textAnchor="middle" className="ring-num">{pct}%</text>
      <text x="100" y="132" textAnchor="middle" className="ring-sub">{label}</text>
    </svg>
  );
}

export default function Today({ store }: { store: Store }) {
  const log = store.docs.log;
  const [date, setDate] = useState(toISO(new Date()));
  const sessions = useMemo(() => liveSessions(log), [log]);
  const nextDay = useMemo(() => {
    const last = sessions[sessions.length - 1];
    return last ? (last[1].day % 4) + 1 : 1;
  }, [sessions]);
  const [dayId, setDayId] = useState<number>(() => {
    const t = liveSessions(log).find(([, s]) => s.d === toISO(new Date()));
    return t ? t[1].day : nextDay;
  });
  const [edits, setEdits] = useState<Record<string, Edit[]>>({});
  const [extra, setExtra] = useState<Record<string, number>>({});

  const day = DAYS.find((d) => d.id === dayId)!;
  const key = keyOf(date, dayId);
  const cur = log[key] && !log[key].del ? log[key] : undefined;
  const n = sessions.filter(([k, s]) => k !== key && s.d <= date).length;
  const wk = cur?.b ?? blockWeek(n);
  const deload = isDeload(wk);

  useEffect(() => { setEdits({}); setExtra({}); }, [key]);
  const pick = (d: string) => {
    setDate(d);
    const t = liveSessions(log).find(([, s]) => s.d === d);
    setDayId(t ? t[1].day : nextDay);
  };

  const rows = (slot: Slot, idx: number) => {
    const def = EX[slot.ex];
    const k = slot.ex;
    const sugg = suggest(def, lastBefore(log, slot.ex, date, key)?.sets, setsFor(slot, wk));
    const saved = cur?.x[k] ?? [];
    const count = Math.max(setsFor(slot, wk), saved.length, extra[k] ?? 0);
    const view = Array.from({ length: count }, (_, i) => {
      const e = edits[k]?.[i] ?? {};
      const w = e.w ?? (saved[i] ? String(saved[i][0]).replace('.', ',') : sugg.w !== null ? String(sugg.w).replace('.', ',') : '');
      const r = e.r ?? (saved[i] ? String(saved[i][1]) : '');
      return { w, r, ph: String(sugg.reps[Math.min(i, sugg.reps.length - 1)] ?? def.min) };
    });
    return { def, k, sugg, view };
  };

  const save = (nextEdits: Record<string, Edit[]>, nextExtra = extra) => {
    const x: Record<string, SetRec[]> = {};
    day.slots.forEach((slot, idx) => {
      const k = slot.ex;
      const sugg = suggest(EX[slot.ex], lastBefore(log, slot.ex, date, key)?.sets, setsFor(slot, wk));
      const saved = cur?.x[k] ?? [];
      const count = Math.max(setsFor(slot, wk), saved.length, nextExtra[k] ?? 0);
      const sets: SetRec[] = [];
      for (let i = 0; i < count; i++) {
        const e = nextEdits[k]?.[i] ?? {};
        const rs = e.r ?? (saved[i] ? String(saved[i][1]) : '');
        const ws = e.w ?? (saved[i] ? String(saved[i][0]) : sugg.w !== null ? String(sugg.w) : '');
        const r = num(rs), w = num(ws);
        if (r > 0) sets.push([Number.isFinite(w) ? w : 0, r]);
      }
      if (sets.length) x[k] = sets;
    });
    const empty = Object.keys(x).length === 0;
    if (empty && !cur) return;
    const s: Session = { d: date, day: dayId, b: wk, x, u: new Date().toISOString(), ...(empty ? { del: true } : {}) };
    store.commit('log', { ...log, [key]: s });
  };
  const change = (k: string, i: number, field: 'w' | 'r', v: string) => {
    const arr = [...(edits[k] ?? [])];
    arr[i] = { ...arr[i], [field]: v };
    const next = { ...edits, [k]: arr };
    setEdits(next);
    save(next);
  };
  const addSet = (k: string, current: number) => { const e = { ...extra, [k]: current + 1 }; setExtra(e); };

  // progreso
  let planned = 0, done = 0;
  day.slots.forEach((slot, idx) => { planned += setsFor(slot, wk); done += Math.min(setsFor(slot, wk), cur?.x[slot.ex]?.length ?? 0); });
  const pct = planned ? Math.round((done / planned) * 100) : 0;
  const isToday = date === toISO(new Date());

  const groups = new Map<string, number>();
  return (
    <div className="stack" style={{ ['--accent' as string]: day.color }}>
      <header className="hero">
        <div className="datebar">
          <button aria-label="Día anterior" onClick={() => pick(addDays(date, -1))}>‹</button>
          <div>
            <div className="date">{isToday ? 'Hoy' : fmtShort(date)}</div>
            <div className="muted small">{day.name} · {day.focus}</div>
          </div>
          <button aria-label="Día siguiente" onClick={() => pick(addDays(date, 1))}>›</button>
        </div>
        <div className="phase-chip"><span className="dot" /> Semana {wk}/6{deload ? ' · Descarga' : ''}</div>
        <Ring pct={pct} color={day.color} label={`${done}/${planned} series`} />
        <div className="range muted small">≈ {estMinutes(day, wk)} min · descanso y RIR indicados en cada ejercicio</div>
        <div className="seg">
          {DAYS.map((d) => (
            <button key={d.id} className={dayId === d.id ? 'on' : ''} onClick={() => setDayId(d.id)}>
              {d.id}{d.id === nextDay && !cur ? ' ★' : ''}
            </button>
          ))}
        </div>
      </header>

      <div className="exgrid">
        {day.slots.map((slot, idx) => {
          const { def, k, sugg, view } = rows(slot, idx);
          let tag = '';
          if (slot.ss) { const c = (groups.get(slot.ss) ?? 0) + 1; groups.set(slot.ss, c); tag = `SS ${slot.ss}${c}`; }
          const rir = rirFor(def, wk);
          const last = lastBefore(log, slot.ex, date, key);
          return (
            <section key={k} className="card ex">
              <div className="ex-top">
                <h3>{def.name}</h3>
                {tag && <span className="pill">{tag}</span>}
              </div>
              <div className="chips-static">
                <span className="tag">{setsFor(slot, wk)} × {def.min}–{def.max}</span>
                <span className="tag">RIR {rir}</span>
                <span className="tag">{Math.floor(def.rest / 60)}:{String(def.rest % 60).padStart(2, '0')} desc.</span>
              </div>
              <p className="muted small hint">
                {sugg.kind === 'first' ? 'Primera vez: elige un peso con el RIR indicado.' : sugg.kind === 'up' ? `Sube a ${fmtKg(sugg.w!)} kg · objetivo ${sugg.reps[0]} reps` : `Mantén ${fmtKg(sugg.w!)} kg · objetivo ${sugg.reps.join('·')} reps`}
                {last && <> · Última ({fmtShort(last.d)}): {last.sets.map((s) => `${fmtKg(s[0])}×${s[1]}`).join(' ')}</>}
              </p>
              <div className="sets">
                <div className="set-h"><span>Serie</span><span>kg</span><span>Reps</span></div>
                {view.map((v, i) => (
                  <div className="set" key={i}>
                    <span className="set-n">{i + 1}</span>
                    <input inputMode="decimal" aria-label={`Peso serie ${i + 1}`} value={v.w} onChange={(e) => change(k, i, 'w', e.target.value)} />
                    <input inputMode="numeric" aria-label={`Repeticiones serie ${i + 1}`} placeholder={v.ph} value={v.r} onChange={(e) => change(k, i, 'r', e.target.value)} />
                  </div>
                ))}
              </div>
              <button className="link" onClick={() => addSet(k, view.length)}>+ serie</button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
