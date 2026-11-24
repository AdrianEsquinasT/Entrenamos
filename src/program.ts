// Programa permanente de 4 días. Bloques de 6 "semanas" (4 sesiones = 1 semana): 5 de progresión + 1 de descarga.
export type DayId = 1 | 2 | 3 | 4;

export interface ExDef {
  id: string;
  name: string;
  min: number; // reps mínimas del rango
  max: number; // reps máximas del rango (al alcanzarlas en todas las series -> subir peso)
  floor: number; // RIR mínimo permitido (ejercicios pesados/técnicos nunca llegan al fallo)
  rest: number; // descanso en segundos
  inc: number; // salto de peso en kg
}
export interface Slot { ex: string; sets: number; ss?: string } // ss: letra de superserie (mismo letra = pareja)
export interface Day { id: DayId; name: string; focus: string; color: string; slots: Slot[] }

const E = (id: string, name: string, min: number, max: number, floor: number, rest: number, inc: number): ExDef => ({ id, name, min, max, floor, rest, inc });

export const EXERCISES: ExDef[] = [
  E('press_mm', 'Press con mancuernas', 6, 10, 2, 150, 2),
  E('press_mm_inc', 'Press con mancuernas inclinado', 8, 12, 1, 120, 2),
  E('press_maq_inc', 'Press en máquina inclinada', 8, 12, 1, 120, 2.5),
  E('cierres_pecho', 'Cierres en máquina (pecho)', 12, 15, 0, 75, 2.5),
  E('lateral', 'Elevaciones laterales', 12, 20, 0, 60, 1),
  E('jalon_abierto', 'Jalón al pecho agarre abierto', 8, 12, 1, 120, 2.5),
  E('remo_t', 'Remo en T', 8, 12, 1, 120, 2.5),
  E('remo_polea', 'Remo en polea', 10, 12, 1, 105, 2.5),
  E('remo_mm', 'Remo con mancuerna (por brazo)', 8, 12, 1, 90, 2),
  E('remo_maq', 'Remo en máquina', 10, 15, 0, 90, 2.5),
  E('rdl', 'Peso muerto rumano', 6, 10, 2, 180, 2.5),
  E('hacka', 'Sentadilla Hack', 8, 12, 1, 150, 5),
  E('prensa', 'Prensa', 10, 15, 1, 120, 5),
  E('ext_cuad', 'Extensión de cuádriceps', 12, 15, 0, 75, 2.5),
  E('curl_fem', 'Curl femoral', 10, 15, 0, 75, 2.5),
  E('aductor', 'Cierres sentado en máquina (aductores)', 12, 15, 0, 60, 2.5),
  E('abductor', 'Aperturas sentado en máquina (abductores)', 12, 15, 0, 60, 2.5),
  E('press_militar', 'Press militar', 6, 10, 2, 150, 2.5),
  E('press_decl', 'Press en máquina declinada', 8, 12, 1, 120, 2.5),
  E('jalon_cerrado', 'Jalón al pecho agarre cerrado', 8, 12, 1, 120, 2.5),
  E('curl_mm', 'Curl de bíceps con mancuernas', 8, 12, 0, 75, 1),
  E('curl_maq', 'Curl en máquina', 10, 15, 0, 75, 2.5),
  E('curl_sentado', 'Curl sentado', 10, 15, 0, 75, 1),
  E('triceps_nuca', 'Tríceps tras nuca', 10, 15, 0, 75, 1),
  E('triceps_maq', 'Tríceps en máquina', 10, 15, 0, 75, 2.5),
  E('triceps_polea', 'Tríceps en polea', 10, 15, 0, 75, 2.5),
];
export const EX: Record<string, ExDef> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const DAYS: Day[] = [
  { id: 1, name: 'Día 1', focus: 'Espalda + bíceps', color: '#38bdf8', slots: [
    { ex: 'jalon_abierto', sets: 3 }, { ex: 'remo_t', sets: 3 }, { ex: 'remo_polea', sets: 3 }, { ex: 'remo_mm', sets: 3 },
    { ex: 'curl_mm', sets: 3 }, { ex: 'curl_sentado', sets: 2 },
  ] },
  { id: 2, name: 'Día 2', focus: 'Pecho + tríceps', color: '#ff7a1a', slots: [
    { ex: 'press_mm', sets: 4 }, { ex: 'press_mm_inc', sets: 3 }, { ex: 'press_maq_inc', sets: 3 },
    { ex: 'cierres_pecho', sets: 3, ss: 'A' }, { ex: 'triceps_polea', sets: 3, ss: 'A' },
    { ex: 'triceps_nuca', sets: 3, ss: 'B' }, { ex: 'lateral', sets: 3, ss: 'B' },
  ] },
  { id: 3, name: 'Día 3', focus: 'Piernas + hombro', color: '#34d399', slots: [
    { ex: 'rdl', sets: 3 }, { ex: 'hacka', sets: 3 }, { ex: 'prensa', sets: 3 },
    { ex: 'ext_cuad', sets: 3, ss: 'A' }, { ex: 'curl_fem', sets: 4, ss: 'A' },
    { ex: 'aductor', sets: 2, ss: 'B' }, { ex: 'abductor', sets: 2, ss: 'B' },
    { ex: 'press_militar', sets: 3 },
  ] },
  { id: 4, name: 'Día 4', focus: 'Torso', color: '#f472b6', slots: [
    { ex: 'press_decl', sets: 3, ss: 'A' }, { ex: 'jalon_cerrado', sets: 3, ss: 'A' },
    { ex: 'remo_maq', sets: 3, ss: 'B' }, { ex: 'lateral', sets: 4, ss: 'B' },
    { ex: 'curl_maq', sets: 3, ss: 'C' }, { ex: 'triceps_maq', sets: 3, ss: 'C' },
  ] },
];

export const BLOCK_WEEKS = 6;
export const SESSIONS_PER_WEEK = 4;
const BASE_RIR = [3, 2, 2, 1, 1, 4];

/** Semana del bloque (1-6) para la sesión número n (0-based) */
export const blockWeek = (n: number) => (Math.floor(n / SESSIONS_PER_WEEK) % BLOCK_WEEKS) + 1;
export const isDeload = (wk: number) => wk === BLOCK_WEEKS;
export const rirFor = (def: ExDef, wk: number) => {
  if (isDeload(wk)) return 4;
  const base = def.floor === 0 && wk === 5 ? 0 : BASE_RIR[wk - 1];
  return Math.max(base, def.floor);
};
export const setsFor = (slot: Slot, wk: number) => (isDeload(wk) ? Math.max(1, Math.round(slot.sets * 0.6)) : slot.sets);

/** Estimación de duración en minutos (40 s por serie + descansos + 6' de calentamiento) */
export function estMinutes(day: Day, wk: number): number {
  const WORK = 40;
  let sec = 6 * 60;
  const groups = new Map<string, Slot[]>();
  for (const s of day.slots) {
    if (!s.ss) sec += setsFor(s, wk) * (WORK + EX[s.ex].rest);
    else groups.set(s.ss, [...(groups.get(s.ss) ?? []), s]);
  }
  for (const g of groups.values()) {
    const ns = g.map((s) => setsFor(s, wk));
    const rounds = Math.max(...ns);
    const rest = Math.max(...g.map((s) => EX[s.ex].rest));
    sec += ns.reduce((a, b) => a + b, 0) * WORK + rounds * (rest + 15);
  }
  return Math.round(sec / 60);
}

// ---------- Progresión ----------
export type SetRec = [number, number]; // [kg, reps]
export const e1rm = (w: number, r: number) => (w > 0 && r > 0 ? w * (1 + Math.min(r, 20) / 30) : 0);
const roundTo = (n: number, step: number) => Math.round(n / step) * step;
export const fmtKg = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

export interface Suggestion { w: number | null; reps: number[]; kind: 'first' | 'up' | 'hold' }

/** Doble progresión: si todas las series al peso de trabajo llegan al tope del rango -> sube peso; si no, +1 rep por serie. */
export function suggest(def: ExDef, last: SetRec[] | undefined, nSets: number): Suggestion {
  if (!last || !last.length) return { w: null, reps: Array(nSets).fill(def.min), kind: 'first' };
  const W = Math.max(...last.map((s) => s[0]));
  const atW = last.filter((s) => s[0] === W);
  const need = Math.min(2, nSets);
  const top = atW.length >= need && atW.every((s) => s[1] >= def.max);
  if (top && W > 0) {
    const Wn = roundTo(W + def.inc, def.inc >= 2.5 ? 0.5 : 0.25);
    const best = Math.max(...atW.map((s) => e1rm(s[0], s[1])));
    const r = Math.min(def.max, Math.max(def.min, Math.round(30 * (best / Wn - 1))));
    return { w: Wn, reps: Array(nSets).fill(r), kind: 'up' };
  }
  const reps = Array.from({ length: nSets }, (_, i) => Math.min(def.max, (atW[Math.min(i, atW.length - 1)][1]) + 1));
  return { w: W, reps, kind: 'hold' };
}
