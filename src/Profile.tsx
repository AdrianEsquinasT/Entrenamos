import { useEffect, useState } from 'react';
import { cloudEnabled } from './cloud';
import type { Profile as P, Store } from './store';

export default function Profile({ store }: { store: Store }) {
  const saved = store.docs.profile;
  const [p, setP] = useState<P>(saved);
  useEffect(() => setP(saved), [saved.name, saved.age, saved.weight, saved.height]);
  const set = (k: keyof P, v: string) => { const n = { ...p, [k]: v }; setP(n); store.commit('profile', n); };
  const h = parseFloat(p.height.replace(',', '.')), w = parseFloat(p.weight.replace(',', '.'));
  const imc = h > 0 && w > 0 ? w / Math.pow(h / 100, 2) : null;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store.docs, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'entrenamos-datos.json'; a.click();
  };
  return (
    <div className="stack">
      <h2>Perfil</h2>
      <section className="card">
        <label className="field"><span>Nombre completo</span><input type="text" autoComplete="name" value={p.name} onChange={(e) => set('name', e.target.value)} /></label>
        <div className="three">
          <label className="field"><span>Edad</span><input inputMode="numeric" value={p.age} onChange={(e) => set('age', e.target.value)} /></label>
          <label className="field"><span>Peso (kg)</span><input inputMode="decimal" value={p.weight} onChange={(e) => set('weight', e.target.value)} /></label>
          <label className="field"><span>Altura (cm)</span><input inputMode="numeric" value={p.height} onChange={(e) => set('height', e.target.value)} /></label>
        </div>
        {imc && <p className="muted small">IMC: {imc.toFixed(1).replace('.', ',')}</p>}
      </section>
      <section className="card">
        <h3>Cuenta y sincronización</h3>
        {!cloudEnabled || !store.session ? (
          <p className="muted small">Sin conexión a la nube: los datos se guardan solo en este dispositivo.</p>
        ) : (
          <>
            <p className="small">{store.session.user.email?.split('@')[0]}</p>
            <p className={store.status === 'error' ? 'error small' : 'muted small'}>{{ off: 'Sin nube', local: 'Local', syncing: 'Sincronizando…', ok: 'Sincronizado', error: 'Error' }[store.status]}{store.errMsg ? `: ${store.errMsg}` : ''}</p>
            <div className="row-btns">
              <button className="ghost" onClick={() => store.syncAll()}>Sincronizar</button>
              <button className="ghost danger" onClick={() => store.signOut()}>Cerrar sesión</button>
            </div>
          </>
        )}
        <button className="link" onClick={exportData}>Exportar datos (JSON)</button>
      </section>
    </div>
  );
}
