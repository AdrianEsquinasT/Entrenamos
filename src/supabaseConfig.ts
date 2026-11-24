// URL y clave "anon/publishable" del proyecto Supabase de ESTA app (pública por diseño: la seguridad la dan las políticas RLS de supabase/schema.sql).
// NUNCA pongas aquí la service_role. Mientras estén vacías, la app funciona solo en local (sin login).
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

// Se escribe solo "adrian" -> adrian@correo.es ; la contraseña es "00000" + el dígito que se pide.
export const LOGIN_DOMAINS = ['correo.es'];
export const PASSWORD_PREFIX = '00000';
