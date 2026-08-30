// ============================================================================
// Cálculos financieros derivados (todos read-only: source → calc → display)
// ============================================================================
import type { Concept, Category } from './types';

const SURVIVAL_SUBCAT = 'Gastos de supervivencia';

const sum = (ns: number[]): number => ns.reduce((a, b) => a + b, 0);

export function active(concepts: Concept[]): Concept[] {
  return concepts.filter((c) => !c.archived);
}

export function byCategory(concepts: Concept[], cat: Category): Concept[] {
  return active(concepts).filter((c) => c.category === cat);
}

export function totalOf(concepts: Concept[], cat: Category): number {
  return sum(byCategory(concepts, cat).map((c) => c.amount));
}

/** Conceptos que son deuda: cuotas finitas dentro de categorías de obligación. */
const DEBT_CATS: Category[] = ['fixed', 'memberships'];
export function installmentConcepts(concepts: Concept[]): Concept[] {
  return active(concepts).filter((c) => (c.installments ?? 0) > 0 && DEBT_CATS.includes(c.category));
}

/** Deuda mensual = suma de las cuotas mensuales. */
export function monthlyDebt(concepts: Concept[]): number {
  return sum(installmentConcepts(concepts).map((c) => c.amount));
}

/** Deuda total = suma de (cuota × cuotas restantes). */
export function totalDebt(concepts: Concept[]): number {
  return sum(installmentConcepts(concepts).map((c) => c.amount * (c.installments ?? 0)));
}

export function totalIncome(concepts: Concept[]): number {
  return totalOf(concepts, 'income');
}

/** Gastos de supervivencia (para cobertura del fondo de emergencia). */
export function essentialExpenses(concepts: Concept[]): number {
  return sum(
    byCategory(concepts, 'fixed')
      .filter((c) => c.type === SURVIVAL_SUBCAT)
      .map((c) => c.amount),
  );
}

/**
 * Salidas totales del mes. La deuda (installment) ya vive dentro de sus
 * categorías (p.ej. Gastos fijos → Obligaciones no esenciales), por lo que NO
 * se suma aparte: eso evita el doble conteo.
 */
export function totalOutflow(concepts: Concept[]): number {
  return (
    totalOf(concepts, 'fixed') +
    totalOf(concepts, 'memberships') +
    totalOf(concepts, 'unexpected') +
    totalOf(concepts, 'entertainment') +
    totalOf(concepts, 'provisions')
  );
}

/** Flujo de caja libre del mes. */
export function availableBalance(concepts: Concept[]): number {
  return totalIncome(concepts) - totalOutflow(concepts);
}

export function savings(concepts: Concept[]): number {
  return totalOf(concepts, 'provisions');
}

export function savingsRate(concepts: Concept[]): number {
  const inc = totalIncome(concepts);
  return inc ? (savings(concepts) / inc) * 100 : 0;
}

export function emergencyFund(concepts: Concept[]): number {
  return sum(
    byCategory(concepts, 'provisions')
      .filter((c) => /emergen/i.test(c.name) || /emergen/i.test(c.type))
      .map((c) => c.amount),
  );
}

export function emergencyMonths(concepts: Concept[]): number {
  const essential = essentialExpenses(concepts);
  return essential ? emergencyFund(concepts) / essential : 0;
}

/** Relación de endeudamiento (%) = deuda mensual / ingreso neto. */
export function debtToIncomeRatio(concepts: Concept[]): number {
  const inc = totalIncome(concepts);
  return inc ? (monthlyDebt(concepts) / inc) * 100 : 0;
}
