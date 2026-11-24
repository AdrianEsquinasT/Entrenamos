import { useState } from 'react';
import { cloudEnabled } from './cloud';
import History from './History';
import Profile from './Profile';
import Progress from './Progress';
import Today from './Today';
import { LOGIN_DOMAINS, PASSWORD_PREFIX } from './supabaseConfig';
import { Store, useStore } from './store';

type Tab = 'today' | 'history' | 'progress' | 'profile';
const TABS: [Tab, string][] = [['today', 'Entreno'], ['history', 'Historial'], ['progress', 'Progreso'], ['profile', 'Perfil']];

function Login({ store }: { store: Store }) {
  const [user, setUser] = useState('');
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const login = async () => {
    setBusy(true);
    const u = user.trim().toLowerCase();
    const candidates = u.includes('@') ? [u] : LOGIN_DOMAINS.map((d) => `${u}@${d}`);
    let e = '';
    for (const c of candidates) { e = await store.signIn(c, PASSWORD_PREFIX + pin); if (!e) break; }
    setMsg(e ? (/invalid login/i.test(e) ? 'Usuario o carácter incorrectos.' : e) : '');
    setBusy(false);
  };
  return (
    <form className="stack login" onSubmit={(e) => { e.preventDefault(); if (user && pin && !busy) login(); }}>
      <h2>Entrenamos</h2>
      <p className="muted">Inicia sesión para continuar.</p>
      <section className="card">
        <label className="field"><span>Usuario</span><input type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={user} onChange={(e) => setUser(e.target.value)} /></label>
        <label className="field"><span>Carácter</span><input type="password" maxLength={1} autoCapitalize="none" autoCorrect="off" autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value.slice(0, 1))} /></label>
        {msg && <p className="error">{msg}</p>}
        <button className="primary" type="submit" disabled={busy || !user || !pin}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </section>
    </form>
  );
}

export default function App() {
  const store = useStore();
  const [tab, setTab] = useState<Tab>('today');
  if (cloudEnabled && !store.ready) return <div className="app"><p className="muted splash">Cargando…</p></div>;
  if (cloudEnabled && !store.session) return <div className="app"><Login store={store} /></div>;
  return (
    <div className="app">
      <main>
        {tab === 'today' && <Today store={store} />}
        {tab === 'history' && <History store={store} />}
        {tab === 'progress' && <Progress store={store} />}
        {tab === 'profile' && <Profile store={store} />}
      </main>
      <nav className="tabs">
        {TABS.map(([t, l]) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{l}</button>)}
      </nav>
    </div>
  );
}
