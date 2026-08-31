// ============================================================================
// Control de gasto — registro 1 a 1 de gastos reales.
// El total mensual se integra como un bloque dentro de Entretenimiento,
// que se SUMA a lo presupuestado y por tanto descuenta de los saldos.
// ============================================================================
import type { Concept } from './types';

export type SpendCategory = 'Comida' | 'Ropa' | 'Diversión' | 'Licencia' | 'Otro';

export const SPEND_CATEGORIES: SpendCategory[] = ['Comida', 'Ropa', 'Diversión', 'Licencia', 'Otro'];

export const SPEND_COLORS: Record<SpendCategory, string> = {
  Comida: '#f39f5a',
  Ropa: '#4fd1c5',
  Diversión: '#ae445a',
  Licencia: '#682549',
  Otro: '#8b83a3',
};

export interface Spend {
  id: string;
  amount: number;
  date: string;   // ISO YYYY-MM-DD (historial)
  month: number;  // 0-11: mes al que se consolida el gasto
  category: SpendCategory;
  note?: string;
  updatedAt?: string;
}

/** Total de gasto real en un mes (0-11). */
export function spendTotalForMonth(spends: Spend[], month: number): number {
  return spends.filter((s) => s.month === month).reduce((sum, s) => sum + s.amount, 0);
}

/** Gasto real del mes actual (atajo). */
export function currentMonthSpend(spends: Spend[], now = new Date()): number {
  return spendTotalForMonth(spends, now.getMonth());
}

/**
 * Convierte los gastos reales en conceptos sintéticos de Entretenimiento
 * (uno por mes con gasto), para que el motor de resumen/saldos los descuente
 * sin tocar los conceptos presupuestados del usuario.
 */
export function spendConcepts(spends: Spend[]): Concept[] {
  const byMonth = new Map<number, number>();
  for (const s of spends) byMonth.set(s.month, (byMonth.get(s.month) ?? 0) + s.amount);
  return [...byMonth.entries()]
    .filter(([, total]) => total > 0)
    .map(([month, total]) => ({
      id: `__spend_${month}`,
      name: 'Control de gasto',
      category: 'entertainment' as const,
      type: 'Control de gasto',
      kind: 'oneoff' as const,
      frequency: 'monthly' as const,
      amount: total,
      startMonth: month,
      installments: 1,
      recurring: false,
    }));
}
