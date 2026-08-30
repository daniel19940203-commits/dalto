import type { Concept } from '../domain/finance/types';
import type { AgendaEvent } from '../domain/agenda/types';
import { CATEGORY_COLORS } from '../domain/agenda/types';

export const SEED_CONCEPTS: Concept[] = [
  { id: 'i1', name: 'Salario', category: 'income', type: 'Ingresos fijos', kind: 'income', frequency: 'monthly', amount: 4_500_000 },
  { id: 'i2', name: 'Freelance', category: 'income', type: 'Ingresos variables', kind: 'income', frequency: 'monthly', amount: 800_000 },
  { id: 'f1', name: 'Arriendo', category: 'fixed', type: 'Gastos de supervivencia', kind: 'recurring', frequency: 'monthly', amount: 1_400_000 },
  { id: 'f2', name: 'Servicios públicos', category: 'fixed', type: 'Gastos de supervivencia', kind: 'recurring', frequency: 'monthly', amount: 280_000 },
  { id: 'f3', name: 'Transporte', category: 'fixed', type: 'Gastos de supervivencia', kind: 'recurring', frequency: 'monthly', amount: 220_000 },
  { id: 'f4', name: 'Internet', category: 'fixed', type: 'Obligaciones no esenciales', kind: 'recurring', frequency: 'monthly', amount: 120_000 },
  { id: 'f5', name: 'Tarjeta de crédito', category: 'fixed', type: 'Obligaciones no esenciales', kind: 'installment', frequency: 'monthly', amount: 500_000, installments: 8 },
  { id: 'f6', name: 'Crédito libre inversión', category: 'fixed', type: 'Obligaciones no esenciales', kind: 'installment', frequency: 'monthly', amount: 650_000, installments: 18 },
  { id: 'm1', name: 'Gimnasio', category: 'memberships', type: 'Membresías', kind: 'recurring', frequency: 'monthly', amount: 95_000 },
  { id: 'm2', name: 'Streaming', category: 'memberships', type: 'Ocio', kind: 'recurring', frequency: 'monthly', amount: 44_000 },
  { id: 'u1', name: 'Médico', category: 'unexpected', type: 'Imprevistos', kind: 'oneoff', frequency: 'monthly', amount: 180_000 },
  { id: 'u2', name: 'Reparaciones', category: 'unexpected', type: 'Imprevistos', kind: 'oneoff', frequency: 'monthly', amount: 150_000 },
  { id: 'p1', name: 'Fondo de emergencia', category: 'provisions', type: 'Fondo de emergencia', kind: 'saving', frequency: 'monthly', amount: 500_000 },
  { id: 'p2', name: 'Ahorro personal', category: 'provisions', type: 'Ahorro personal', kind: 'saving', frequency: 'monthly', amount: 400_000 },
  { id: 'e1', name: 'Restaurantes', category: 'entertainment', type: 'Entretenimiento y diversión', kind: 'oneoff', frequency: 'monthly', amount: 300_000 },
  { id: 'e2', name: 'Viajes', category: 'entertainment', type: 'Entretenimiento y diversión', kind: 'oneoff', frequency: 'monthly', amount: 250_000 },
  { id: 'b1', name: 'Cuenta corriente', category: 'balances', type: 'Banca', kind: 'balance', frequency: 'monthly', amount: 2_100_000 },
  { id: 'b2', name: 'Cuenta de ahorros', category: 'balances', type: 'Banca', kind: 'balance', frequency: 'monthly', amount: 3_800_000 },
];

export const SEED_EVENTS: AgendaEvent[] = [
  { id: 'ev1', name: 'Cumpleaños de Andrea', date: '2026-08-29', time: '19:00', category: 'Cumpleaños', color: CATEGORY_COLORS['Cumpleaños'], reminder: true },
  { id: 'ev2', name: 'Día de Amor y Amistad', date: '2026-09-20', category: 'Festivo', color: CATEGORY_COLORS['Festivo'] },
  { id: 'ev3', name: 'Reunión familiar', date: '2026-09-05', time: '13:00', category: 'Personal', color: CATEGORY_COLORS['Personal'] },
];
