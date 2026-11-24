import { useState } from 'react';
import { DAYS, EX, fmtKg } from './program';
import type { Store } from './store';
import { Point, fmtShort, history, pctChange } from './stats';

type Metric = 'e1' | 'top' | 'vol';
const METRIC: Record<Metric, string> = { e1: '1RM est.', top: 'Peso máx.', vol: 'Volumen' };

function Line({ pts, color }: { pts: { d: string; v: number }[]; color: string }) {
  const W = 320, H = 130, P = 26;
  const vs = pts.map((p) => p.v);
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const span = hi - lo || 1;
  const x = (i: number) => P + (pts.length === 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (pts.length - 1));
  const y = (v: number) => H - 22 - ((v - lo) / span) * (H - 44);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart">
      <line x1={P} x2={W - P} y1={y(lo)} y2={y(lo)} stroke="var(--line)" />
      <line x1={P} x2={W - P} y1={y(hi)} y2={y(hi)} stroke="var(--line)" strokeDasharray="3 4" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.v)} r="3.5" fill={color} />)}
      <text x={P} y={y(hi) - 5} className="axis">{Math.round(hi * 10) / 10}</text>
      <text x={P} y={y(lo) + 12} className="axis">{Math.round(lo * 10) / 10}</text>
      <text x={P} y={H - 4} className="axis">{fmtShort(pts[0].d)}</text>
      <text x={W - P} y={H - 4} textAnchor="end" className="axis">{fmtShort(pts[pts.length - 1].d)}</text>
    </svg>
  );
}
const val = (p: Point, m: Metric) => (m === 'e1' ? p.e1 : m === 'top' ? p.top : p.vol);

export default function Progress({ store }: { store: Store }) {
  const log = store.docs.log;
  const [dayF, setDayF] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>('e1');

  const items = DAYS.filter((d) => !dayF || d.id === dayF).flatMap((d) => d.slots.map((s) => ({ ex: s.ex, color: d.color })))
    .filter((it, i, a) => a.findIndex((z) => z.ex === it.ex) === i)
    .map((it) => { const h = history(log, it.ex); return { ...it, h, pct: pctChange(h) }; })
    .filter((it) => it.h.length > 0);
  const pcts = items.map((i) => i.pct).filter((p): p is number => p !== null).sort((a, b) => a - b);
  const median = pcts.length ? pcts[Math.floor(pcts.length / 2)] : null;
  const fmtPct = (p: number | null) => (p === null ? '—' : `${p > 0 ? '+' : ''}${p.toFixed(1).replace('.', ',')}%`);

  return (
    <div className="stack">
      <h2>Progreso</h2>
      <section className="card banner-top">
        <div><div className="muted small">Mejora mediana (1RM estimado)</div><div className="big">{fmtPct(median)}</div></div>
        <div className="muted small right">{items.length} ejercicios<br />con registros</div>
      </section>
      <div className="chips">
        {[0, ...DAYS.map((d) => d.id)].map((d) => (
          <button key={d} className={'chip' + (dayF === d ? ' on' : '')} onClick={() => setDayF(d)}>{d === 0 ? 'Todos' : DAYS[d - 1].focus}</button>
        ))}
      </div>
      {items.length === 0 && <p className="muted card">Registra entrenamientos para ver tu evolución.</p>}
      <div className="exgrid">
        {items.map((it) => {
          const w = it.h.filter((p) => !p.deload);
          const last = w[w.length - 1];
          const up = (it.pct ?? 0) >= 0;
          return (
            <section key={it.ex} className="card" style={{ ['--accent' as string]: it.color }}>
              <button className="plain" onClick={() => setOpen(open === it.ex ? null : it.ex)}>
                <div className="ex-top">
                  <h3>{EX[it.ex].name}</h3>
                  <span className={'delta ' + (it.pct === null ? '' : up ? 'up' : 'down')}>{fmtPct(it.pct)}</span>
                </div>
                <div className="muted small">{w.length} sesiones{last ? ` · mejor serie ${fmtKg(last.best[0])}×${last.best[1]}` : ''}</div>
              </button>
              {open === it.ex && w.length > 0 && (
                <div className="daycard">
                  <div className="seg mini3">
                    {(Object.keys(METRIC) as Metric[]).map((m) => <button key={m} className={metric === m ? 'on' : ''} onClick={() => setMetric(m)}>{METRIC[m]}</button>)}
                  </div>
                  <Line pts={w.map((p) => ({ d: p.d, v: val(p, metric) }))} color={it.color} />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
