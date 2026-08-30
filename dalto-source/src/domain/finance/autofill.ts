// ============================================================================
// Auto-fill de periodos futuros + precedencia de valores reales
// ============================================================================
import type { Concept, FinanceOptions } from './types';

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export interface PeriodValue {
  value: number;
  /** true = valor real (registrado o mes pasado); false = proyectado (auto-fill). */
  actual: boolean;
}

/**
 * Valor mensual de un concepto en el mes `m` (0-11).
 *
 * Precedencia:
 *  1. Si existe un valor REAL registrado para ese mes → se usa (actual = true).
 *  2. Si el mes es <= currentMonth → base (histórico real).
 *  3. Si el mes es futuro y autofill está ON → base con incremento compuesto
 *     aplicado SOLO a los meses futuros (nunca a históricos).
 *  4. Si autofill está OFF → 0.
 */
export function monthlyValue(
  concept: Concept,
  m: number,
  opts: FinanceOptions,
): PeriodValue {
  const key = monthKey(opts.year, m);
  const recorded = concept.actuals?.[key];
  if (recorded !== undefined) return { value: recorded, actual: true };

  const start = concept.startMonth ?? 0;
  if (m < start) return { value: 0, actual: m <= opts.currentMonth };

  // Duración finita: si tiene cuotas (meses que dura), aplica solo en
  // [start, start + installments - 1]. Sin cuotas = recurrente infinito.
  const dur = concept.installments ?? 0;
  if (dur > 0 && m > start + dur - 1) return { value: 0, actual: m <= opts.currentMonth };

  if (m <= opts.currentMonth) return { value: concept.amount, actual: true };

  // Mes futuro
  if (!opts.autofill) return { value: 0, actual: false };

  const inc = (concept.monthlyIncrease ?? 0) / 100;
  const steps = m - opts.currentMonth;
  const projected = Math.round(concept.amount * Math.pow(1 + inc, steps));
  return { value: projected, actual: false };
}
