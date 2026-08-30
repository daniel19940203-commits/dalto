// ============================================================================
// DALTO — Modelo de dominio financiero (sin dependencias de UI)
// ============================================================================

export type Frequency = 'monthly' | 'semiMonthly';

export type Category =
  | 'income'
  | 'fixed'
  | 'memberships'
  | 'unexpected'
  | 'provisions'
  | 'entertainment'
  | 'balances';

/**
 * kind describe el comportamiento financiero del concepto:
 * - income      → entra dinero
 * - recurring   → gasto/servicio recurrente sin cuotas (Internet)
 * - installment → obligación con cuotas (Tarjeta de crédito × 8)
 * - saving      → provisión/ahorro (sale del flujo hacia un fondo)
 * - oneoff      → gasto puntual (imprevistos, entretenimiento)
 * - balance     → saldo actual de una cuenta (foto, no flujo mensual)
 */
export type ConceptKind =
  | 'income'
  | 'recurring'
  | 'installment'
  | 'saving'
  | 'oneoff'
  | 'balance';

/** Un valor real registrado para un periodo concreto (pisa la proyección). */
export type ActualMap = Record<string, number>; // periodKey -> monto real

export interface Concept {
  id: string;
  name: string;
  category: Category;
  /** Subcategoría estandarizada (alimenta el Resumen). Ej: "Gastos de supervivencia". */
  type: string;
  kind: ConceptKind;
  frequency: Frequency;
  /** Monto mensual base (o cuota mensual para installment). */
  amount: number;
  /** Cuotas restantes = meses que dura desde startMonth (solo si NO es recurrente). */
  installments?: number;
  /** true = cargo fijo sin caducidad (aplica indefinidamente desde startMonth). */
  recurring?: boolean;
  /** Capital de la deuda (préstamo sin intereses), para estimar la tasa. */
  principal?: number;
  /** Cuotas iniciales (plazo original del crédito), para estimar la tasa. */
  totalInstallments?: number;
  /** Ahorro total (provisiones): suma al ahorro acumulado sin descontar de nada. */
  savingsTotal?: number;
  /** Incremento mensual en % aplicado SOLO a periodos futuros auto-completados. */
  monthlyIncrease?: number;
  /** Mes de inicio 0-11 (dentro del año en curso del prototipo). */
  startMonth?: number;
  /** Valores reales por periodo. Tienen prioridad sobre el auto-fill. */
  actuals?: ActualMap;
  /** Descripción libre opcional. */
  description?: string;
  /** Soft-delete: conserva histórico sin mostrarlo. */
  archived?: boolean;
}

export interface FinanceOptions {
  /** Si false, no se proyectan periodos futuros (quedan en 0). */
  autofill: boolean;
  /** Año en curso (para construir periodKeys). */
  year: number;
  /** Índice del mes "actual" 0-11: hasta aquí los valores son reales. */
  currentMonth: number;
}

export const DEFAULT_OPTIONS: FinanceOptions = {
  autofill: true,
  year: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
};
