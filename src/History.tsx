import { useState } from 'react';
import { DAYS, EX, fmtKg } from './program';
import type { Store } from './store';
import { fmtShort, history, liveSessions } from './stats';

const setTxt = (s: [number, number]) => `${fmtKg(s[0])}×${s[1]}`;

export default function History({ store }: { store: Store }) {
  const log = store.docs.log;
  const [mode, setMode] = useState<'ex' | 'ses'>('ses');
  const [ex, setEx] = useState('press_mm');
  const sessions = liveSessions(log).reverse();

  const del = (key: string) => {
    if (!confirm('¿Borrar esta sesión?')) return;
    store.commit('log', { ...log, [key]: { ...log[key], x: {}, del: true, u: new Date().toISOString() } });
  };

  return (
    <div className="stack">
      <h2>Historial</h2>
      <div className="seg">
        <button className={mode === 'ses' ? 'on' : ''} onClick={() => setMode('ses')}>Por sesión</button>
        <button className={mode === 'ex' ? 'on' : ''} onClick={() => setMode('ex')}>Por ejercicio</button>
      </div>
      {sessions.length === 0 && <p className="muted card">Aún no hay entrenamientos registrados.</p>}
      {mode === 'ex' && (
        <>
          <select value={ex} onChange={(e) => setEx(e.target.value)}>
            {DAYS.map((d) => (
              <optgroup key={d.id} label={`${d.name} · ${d.focus}`}>
                {d.slots.filter((s, i, a) => a.findIndex((z) => z.ex === s.ex) === i).map((s) => <option key={s.ex} value={s.ex}>{EX[s.ex].name}</option>)}
              </optgroup>
            ))}
          </select>
          <div className="stack tight">
            {history(log, ex).reverse().map((p) => (
              <div key={p.key} className="card row">
                <div className="row-top"><b>{fmtShort(p.d)}</b>{p.deload && <span className="tag">Descarga</span>}<span className="small muted">vol. {Math.round(p.vol)} kg</span></div>
                <div className="sets-line">{p.sets.map((s, i) => <span key={i} className={'tag' + (s === p.best ? ' best' : '')}>{setTxt(s)}</span>)}</div>
              </div>
            ))}
            {history(log, ex).length === 0 && sessions.length > 0 && <p className="muted small">Sin registros de este ejercicio.</p>}
          </div>
        </>
      )}
      {mode === 'ses' && (
        <div className="exgrid">
          {sessions.map(([key, s]) => {
            const day = DAYS.find((d) => d.id === s.day)!;
            return (
              <section key={key} className="card" style={{ ['--accent' as string]: day.color, borderLeft: `4px solid ${day.color}` }}>
                <div className="row-top">
                  <b>{fmtShort(s.d)}</b><span className="muted small">{day.name} · {day.focus}</span>
                  <span className="small muted">Sem {s.b}{s.b === 6 ? ' (descarga)' : ''}</span>
                </div>
                {day.slots.filter((sl) => s.x[sl.ex]).map((sl) => (
                  <div key={sl.ex} className="hrow">
                    <span>{EX[sl.ex].name}</span>
                    <span className="sets-line">{s.x[sl.ex].map((st, i) => <span key={i} className="tag">{setTxt(st)}</span>)}</span>
                  </div>
                ))}
                <button className="link danger" onClick={() => del(key)}>Borrar sesión</button>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
