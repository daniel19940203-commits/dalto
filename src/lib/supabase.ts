// ============================================================================
// Cliente de Supabase. La URL y la publishable key son públicas por diseño
// (van en el navegador); la seguridad real la dan las políticas RLS.
// ============================================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://igqljilmjlzadnvkeqhm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9Gm2D-uQD0MB5__jv8lXdw_Trq2ATK_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Valida contraseña: 8–20 caracteres, con al menos una letra y un número. */
export function validatePassword(pw: string): string | null {
  if (pw.length < 8 || pw.length > 20) return 'La contraseña debe tener entre 8 y 20 caracteres.';
  if (!/[a-zA-Z]/.test(pw)) return 'Debe incluir al menos una letra.';
  if (!/\d/.test(pw)) return 'Debe incluir al menos un número.';
  return null;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
