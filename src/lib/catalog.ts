import type { Category, ConceptKind } from '../domain/finance/types';

export const CONCEPT_CATS: Category[] = [
  'income', 'fixed', 'memberships', 'unexpected', 'provisions', 'entertainment', 'balances',
];

export const CAT_META: Record<Category, { t: string; ic: string; kind: ConceptKind }> = {
  income: { t: 'Ingresos', ic: 'trending-up', kind: 'income' },
  fixed: { t: 'Gastos fijos', ic: 'trending-down', kind: 'recurring' },
  memberships: { t: 'Membresías', ic: 'credit-card', kind: 'recurring' },
  unexpected: { t: 'Imprevistos', ic: 'alert', kind: 'oneoff' },
  provisions: { t: 'Provisiones y ahorro', ic: 'shield', kind: 'saving' },
  entertainment: { t: 'Entretenimiento', ic: 'sparkles', kind: 'oneoff' },
  balances: { t: 'Saldos', ic: 'scale', kind: 'balance' },
};

/** Categorías que admiten obligaciones con cuotas. */
export const ALLOW_INST: Category[] = ['fixed', 'memberships', 'unexpected', 'entertainment'];
