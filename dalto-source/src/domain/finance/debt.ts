// ============================================================================
// Estimación de intereses de una deuda a partir de:
//   cuota (payment), capital (principal) y plazo (n = cuotas iniciales).
// ============================================================================
import type { Concept } from './types';
import { installmentConcepts } from './calculations';

export interface DebtInfo {
  payment: number;        // cuota mensual
  term: number;           // plazo usado (cuotas iniciales, o restantes si no hay)
  principal: number;      // capital
  totalToPay: number;     // cuota × plazo (vida del crédito)
  interest: number;       // totalToPay − capital
  interestPct: number;    // interés total sobre el capital (%)
  monthlyRate: number;    // tasa mensual estimada (fracción)
  annualRate: number;     // tasa efectiva anual E.A. (fracción)
  valid: boolean;         // si hay datos suficientes y coherentes
}

/**
 * Resuelve la tasa mensual i de una anualidad:
 *   principal = cuota · (1 − (1+i)^−n) / i
 * por bisección. Devuelve 0 si no hay intereses (o negativos).
 */
export function solveMonthlyRate(principal: number, payment: number, n: number): number {
  if (principal <= 0 || payment <= 0 || n <= 0) return 0;
  if (payment * n <= principal) return 0; // sin intereses
  const f = (i: number) => (payment * (1 - Math.pow(1 + i, -n))) / i - principal;
  let lo = 1e-9, hi = 1; // 0% a 100% mensual
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const v = f(mid);
    if (Math.abs(v) < 1) return mid;
    if (v > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function effectiveAnnual(monthly: number): number {
  return Math.pow(1 + monthly, 12) - 1;
}

/** Info de intereses de un concepto-deuda. term = cuotas iniciales ?? restantes. */
export function debtInfo(c: Concept): DebtInfo | null {
  const principal = c.principal ?? 0;
  const term = c.totalInstallments ?? c.installments ?? 0;
  const payment = c.amount ?? 0;
  if (principal <= 0 || term <= 0 || payment <= 0) return null;
  const totalToPay = payment * term;
  const interest = totalToPay - principal;
  const monthlyRate = solveMonthlyRate(principal, payment, term);
  return {
    payment, term, principal, totalToPay,
    interest,
    interestPct: (interest / principal) * 100,
    monthlyRate,
    annualRate: effectiveAnnual(monthlyRate),
    valid: interest >= 0,
  };
}

/** Capital total consolidado de todas las deudas (para GENERAL). */
export function totalPrincipal(concepts: Concept[]): number {
  return installmentConcepts(concepts).reduce((s, c) => s + (c.principal ?? 0), 0);
}
