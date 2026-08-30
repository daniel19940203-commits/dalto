// ============================================================================
// Control de pagos mes a mes — ¿qué debo pagar y qué ya pagué?
// Estados: Pendiente (default) · Pagado · Aplazado (solo marca, no mueve mes).
// ============================================================================
import type { Concept, FinanceOptions } from './types';
import { byCategory } from './calculations';
import { monthlyValue } from './autofill';

export type PayStatus = 'pending' | 'paid' | 'deferred';

/** Registro de estado: clave `${conceptId}:${year}-${month}` -> estado. */
export type PayLedger = Record<string, PayStatus>;

export function payKey(conceptId: string, year: number, month: number): string {
  return `${conceptId}:${year}-${String(month + 1).padStart(2, '0')}`;
}

export function getStatus(ledger: PayLedger, conceptId: string, year: number, month: number): PayStatus {
  return ledger[payKey(conceptId, year, month)] ?? 'pending';
}

/** Conceptos "pagables" del mes: salidas con valor > 0 en ese mes. */
const PAYABLE_CATS = ['fixed', 'memberships', 'unexpected', 'entertainment', 'provisions'] as const;

export interface PayableItem {
  concept: Concept;
  amount: number;
  status: PayStatus;
}

export function payablesForMonth(
  concepts: Concept[],
  ledger: PayLedger,
  month: number,
  opts: FinanceOptions,
): PayableItem[] {
  const items: PayableItem[] = [];
  for (const cat of PAYABLE_CATS) {
    for (const c of byCategory(concepts, cat)) {
      const { value } = monthlyValue(c, month, opts);
      if (value > 0) items.push({ concept: c, amount: value, status: getStatus(ledger, c.id, opts.year, month) });
    }
  }
  return items;
}

export interface PaySummary {
  income: number;
  paid: number;
  pending: number;
  deferred: number;
  balance: number; // ingreso − pagado
}

export function paySummary(
  concepts: Concept[],
  ledger: PayLedger,
  month: number,
  opts: FinanceOptions,
): PaySummary {
  const items = payablesForMonth(concepts, ledger, month, opts);
  let paid = 0, pending = 0, deferred = 0;
  for (const it of items) {
    if (it.status === 'paid') paid += it.amount;
    else if (it.status === 'deferred') deferred += it.amount;
    else pending += it.amount;
  }
  const income = byCategory(concepts, 'income').reduce((s, c) => s + monthlyValue(c, month, opts).value, 0);
  return { income, paid, pending, deferred, balance: income - paid };
}
