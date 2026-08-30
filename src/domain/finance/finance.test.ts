import { describe, it, expect } from 'vitest';
import type { Concept, FinanceOptions } from './types';
import {
  monthlyDebt,
  totalDebt,
  totalIncome,
  totalOutflow,
  availableBalance,
  debtToIncomeRatio,
  emergencyMonths,
} from './calculations';
import { monthlyValue } from './autofill';
import { buildColumns, saldos, conceptAtColumn } from './summary';
import { solveMonthlyRate, effectiveAnnual, debtInfo } from './debt';
import { spendTotalForMonth, spendConcepts } from './spend';

const YEAR = 2026;
const NOW = 7; // agosto (0-idx)
const opts: FinanceOptions = { autofill: true, year: YEAR, currentMonth: NOW };

function concept(p: Partial<Concept>): Concept {
  return {
    id: p.id ?? 'x',
    name: p.name ?? 'Concept',
    category: p.category ?? 'fixed',
    type: p.type ?? 'Obligaciones no esenciales',
    kind: p.kind ?? 'recurring',
    frequency: p.frequency ?? 'monthly',
    amount: p.amount ?? 0,
    ...p,
  };
}

// Datos base equivalentes al prototipo
const base: Concept[] = [
  concept({ id: 'i1', name: 'Salario', category: 'income', type: 'Ingresos fijos', kind: 'income', amount: 4_500_000 }),
  concept({ id: 'i2', name: 'Freelance', category: 'income', type: 'Ingresos variables', kind: 'income', amount: 800_000 }),
  concept({ id: 'f1', name: 'Arriendo', category: 'fixed', type: 'Gastos de supervivencia', amount: 1_400_000 }),
  concept({ id: 'f2', name: 'Servicios', category: 'fixed', type: 'Gastos de supervivencia', amount: 280_000 }),
  concept({ id: 'f3', name: 'Transporte', category: 'fixed', type: 'Gastos de supervivencia', amount: 220_000 }),
  concept({ id: 'f4', name: 'Internet', category: 'fixed', type: 'Obligaciones no esenciales', amount: 120_000 }),
  concept({ id: 'f5', name: 'Tarjeta de crédito', category: 'fixed', type: 'Obligaciones no esenciales', kind: 'installment', amount: 500_000, installments: 8 }),
  concept({ id: 'f6', name: 'Crédito libre inversión', category: 'fixed', type: 'Obligaciones no esenciales', kind: 'installment', amount: 650_000, installments: 18 }),
  concept({ id: 'm1', name: 'Gimnasio', category: 'memberships', type: 'Membresías', amount: 95_000 }),
  concept({ id: 'm2', name: 'Streaming', category: 'memberships', type: 'Ocio', amount: 44_000 }),
  concept({ id: 'u1', name: 'Médico', category: 'unexpected', type: 'Imprevistos', kind: 'oneoff', amount: 180_000 }),
  concept({ id: 'u2', name: 'Reparaciones', category: 'unexpected', type: 'Imprevistos', kind: 'oneoff', amount: 150_000 }),
  concept({ id: 'p1', name: 'Fondo de emergencia', category: 'provisions', type: 'Fondo de emergencia', kind: 'saving', amount: 500_000 }),
  concept({ id: 'p2', name: 'Ahorro personal', category: 'provisions', type: 'Ahorro personal', kind: 'saving', amount: 400_000 }),
  concept({ id: 'e1', name: 'Restaurantes', category: 'entertainment', type: 'Entretenimiento y diversión', kind: 'oneoff', amount: 300_000 }),
  concept({ id: 'e2', name: 'Viajes', category: 'entertainment', type: 'Entretenimiento y diversión', kind: 'oneoff', amount: 250_000 }),
];

describe('Reglas financieras (sección 85)', () => {
  it('Test 1 — deuda total: 500.000 × 8 = 4.000.000', () => {
    const c = [concept({ kind: 'installment', amount: 500_000, installments: 8 })];
    expect(totalDebt(c)).toBe(4_000_000);
  });

  it('Test 2 — servicio recurrente 120.000 no es deuda con cuotas', () => {
    const c = [concept({ name: 'Internet', amount: 120_000 })];
    expect(monthlyDebt(c)).toBe(0);
    expect(totalDebt(c)).toBe(0);
  });

  it('Test 3 — incremento mensual 5% compone solo hacia el futuro', () => {
    const c = concept({ amount: 100_000, monthlyIncrease: 5, startMonth: NOW });
    // mes actual: base intacta
    expect(monthlyValue(c, NOW, opts).value).toBe(100_000);
    // +1, +2, +3 meses
    expect(monthlyValue(c, NOW + 1, opts).value).toBe(105_000);
    expect(monthlyValue(c, NOW + 2, opts).value).toBe(110_250);
    expect(monthlyValue(c, NOW + 3, opts).value).toBe(115_763); // 115.762,5 → 115.763
  });

  it('Test 4 — auto-fill OFF deja los futuros en 0', () => {
    const c = concept({ amount: 100_000 });
    const off: FinanceOptions = { ...opts, autofill: false };
    expect(monthlyValue(c, NOW + 1, off).value).toBe(0);
    expect(monthlyValue(c, NOW, off).value).toBe(100_000); // el actual sigue
  });

  it('Test 5 — un valor real pisa al auto-completado en su mes', () => {
    const key = `${YEAR}-${String(NOW + 3).padStart(2, '0')}`; // mes futuro con dato real
    const c = concept({ amount: 500_000, actuals: { [key]: 480_000 } });

    // mes futuro sin registro → proyectado
    const projected = monthlyValue(c, NOW + 1, opts);
    expect(projected.value).toBe(500_000);
    expect(projected.actual).toBe(false);

    // mes futuro con registro → el real manda
    const overridden = monthlyValue(c, NOW + 2, opts); // NOW+2 (0-idx) == mes de la key
    expect(overridden.value).toBe(480_000);
    expect(overridden.actual).toBe(true);
  });

  it('Test 6 — quincenal: dos periodos que suman el mes', () => {
    const c = concept({ category: 'fixed', amount: 500_000 });
    const cols = buildColumns([NOW], 'semiMonthly');
    expect(cols).toHaveLength(2);
    const first = conceptAtColumn(c, cols[0], opts);
    const second = conceptAtColumn(c, cols[1], opts);
    expect(first + second).toBe(500_000);
  });

  it('Test 7 — saldo disponible del mes = 211.000', () => {
    expect(availableBalance(base)).toBe(211_000);
  });

  it('Test 8 — total ingresos = 5.300.000', () => {
    expect(totalIncome(base)).toBe(5_300_000);
  });

  it('Test 9 — total salidas (sin doble conteo de deuda)', () => {
    // fixed 3.170.000 + memb 139.000 + unexp 330.000 + entret 550.000 + prov 900.000
    expect(totalOutflow(base)).toBe(5_089_000);
  });

  it('Test 10 — relación de endeudamiento = 21,7%', () => {
    expect(debtToIncomeRatio(base)).toBeCloseTo(21.7, 1);
    expect(monthlyDebt(base)).toBe(1_150_000);
    expect(totalDebt(base)).toBe(15_700_000);
  });
});

describe('Saldos consolidados (Ene→Ago)', () => {
  it('disponible/acumulado/ahorro acumulado suman mes a mes', () => {
    const cols = buildColumns([0, 1, 2, 3, 4, 5, 6, 7], 'monthly');
    const s = saldos(base, cols, opts);
    // disponible constante = 211.000
    expect(s.disponible.every((v) => v === 211_000)).toBe(true);
    // acumulado en Ago (idx 7) = 211.000 × 8
    expect(s.acumulado[7]).toBe(1_688_000);
    // ahorro acumulado = 900.000 × 8
    expect(s.ahorroAcumulado[7]).toBe(7_200_000);
    // total = 8.888.000
    expect(s.total[7]).toBe(8_888_000);
    // ejemplo del usuario: mar 400 / abr 800 (acumulación)
    expect(s.ahorroAcumulado[2]).toBe(2_700_000); // 900k × 3
    expect(s.ahorroAcumulado[3]).toBe(3_600_000); // 900k × 4
  });

  it('mirar solo Ago arrastra el consolidado previo', () => {
    const cols = buildColumns([7], 'monthly');
    const s = saldos(base, cols, opts);
    expect(s.acumulado[0]).toBe(1_688_000); // trae Ene–Jul
    expect(s.ahorroAcumulado[0]).toBe(7_200_000);
  });
});

describe('Cobertura de emergencia', () => {
  it('meses de cobertura ≈ 0,26 (fondo 500k / supervivencia 1.900k)', () => {
    expect(emergencyMonths(base)).toBeCloseTo(0.263, 2);
  });
});

describe('Estimación de intereses de deuda', () => {
  it('recupera la tasa de una anualidad conocida', () => {
    // Préstamo 1.000.000, i=2% mensual, 12 cuotas → cuota ≈ 94.560
    const i = 0.02, n = 12, P = 1_000_000;
    const cuota = P * i / (1 - Math.pow(1 + i, -n));
    const est = solveMonthlyRate(P, cuota, n);
    expect(est).toBeCloseTo(0.02, 3);
    expect(effectiveAnnual(est)).toBeCloseTo(Math.pow(1.02, 12) - 1, 3);
  });
  it('interés total y % sobre capital', () => {
    const info = debtInfo({ id: 'd', name: 'x', category: 'fixed', type: 'Obligaciones no esenciales',
      kind: 'installment', frequency: 'monthly', amount: 500_000, installments: 8, totalInstallments: 8, principal: 3_500_000 });
    expect(info!.totalToPay).toBe(4_000_000);
    expect(info!.interest).toBe(500_000);
    expect(info!.interestPct).toBeCloseTo(14.29, 1);
  });
  it('sin capital no calcula', () => {
    expect(debtInfo({ id: 'd', name: 'x', category: 'fixed', type: 't', kind: 'installment', frequency: 'monthly', amount: 500_000, installments: 8 })).toBeNull();
  });
});

describe('Control de gasto', () => {
  it('suma por mes y genera concepto sintético de entretenimiento', () => {
    const spends = [
      { id: '1', amount: 18_000, date: '2026-09-03', month: 8, category: 'Comida' as const },
      { id: '2', amount: 50_000, date: '2026-09-10', month: 8, category: 'Ropa' as const },
      { id: '3', amount: 30_000, date: '2026-08-02', month: 7, category: 'Diversión' as const },
    ];
    expect(spendTotalForMonth(spends, 8)).toBe(68_000);
    const synth = spendConcepts(spends);
    expect(synth).toHaveLength(2);
    const sep = synth.find((c) => c.startMonth === 8)!;
    expect(sep.amount).toBe(68_000);
    expect(sep.category).toBe('entertainment');
    expect(sep.installments).toBe(1);
  });
});

import { debtPayoffPlans, investmentAdvice } from './advisor-actions';
import { paySummary, payablesForMonth, payKey } from './payments';

describe('Asesor — acciones', () => {
  it('ordena deudas por avalancha (E.A.) y bola de nieve (saldo)', () => {
    const c = [
      concept({ id: 'a', name: 'Chico caro', category: 'fixed', type: 'Obligaciones no esenciales', kind: 'installment', amount: 100_000, installments: 6, totalInstallments: 6, principal: 500_000 }),
      concept({ id: 'b', name: 'Grande barato', category: 'fixed', type: 'Obligaciones no esenciales', kind: 'installment', amount: 500_000, installments: 10, totalInstallments: 10, principal: 4_800_000 }),
    ];
    const { avalanche, snowball } = debtPayoffPlans(c);
    // 'a' tiene más interés (100k*6=600k vs 500k cap) → mayor E.A. → primero en avalancha
    expect(avalanche[0].concept.id).toBe('a');
    // 'a' tiene menor saldo (600k vs 5M) → primero en bola de nieve también aquí
    expect(snowball[0].concept.id).toBe('a');
  });
  it('sugiere invertir el excedente del mes', () => {
    const adv = investmentAdvice(base);
    expect(adv.monthlyFree).toBe(211_000);
    expect(adv.investable).toBeGreaterThanOrEqual(211_000);
  });
});

describe('Control de pagos', () => {
  const opts2 = { autofill: true, year: 2026, currentMonth: 7 };
  it('por defecto todo pendiente; suma según estado', () => {
    const ledger = { [payKey('f1', 2026, 7)]: 'paid' as const };
    const items = payablesForMonth(base, ledger, 7, opts2);
    expect(items.length).toBeGreaterThan(0);
    const s = paySummary(base, ledger, 7, opts2);
    expect(s.income).toBe(5_300_000);
    expect(s.paid).toBe(1_400_000); // Arriendo marcado pagado
    expect(s.balance).toBe(5_300_000 - 1_400_000);
    expect(s.pending).toBeGreaterThan(0);
  });
});
