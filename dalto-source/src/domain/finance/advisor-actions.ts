// ============================================================================
// Acciones recomendadas del Asesor — pasa de diagnosticar a decir QUÉ hacer.
// ============================================================================
import type { Concept } from './types';
import { installmentConcepts, availableBalance, essentialExpenses, emergencyFund, savings } from './calculations';
import { debtInfo } from './debt';

export interface DebtRanked {
  concept: Concept;
  balance: number;   // saldo restante (cuota × cuotas restantes)
  annualRate: number | null; // E.A. estimada si hay datos
  payment: number;
}

function debtBalance(c: Concept): number {
  return c.amount * (c.installments ?? 0);
}

/** Ordena las deudas por Avalancha (mayor E.A. primero) y Bola de nieve (menor saldo primero). */
export function debtPayoffPlans(concepts: Concept[]): { avalanche: DebtRanked[]; snowball: DebtRanked[] } {
  const debts: DebtRanked[] = installmentConcepts(concepts).map((c) => {
    const info = debtInfo(c);
    return { concept: c, balance: debtBalance(c), annualRate: info ? info.annualRate : null, payment: c.amount };
  });
  const avalanche = [...debts].sort((a, b) => (b.annualRate ?? -1) - (a.annualRate ?? -1) || b.balance - a.balance);
  const snowball = [...debts].sort((a, b) => a.balance - b.balance);
  return { avalanche, snowball };
}

export interface InvestmentAdvice {
  investable: number;      // cuánto poner a trabajar
  keepLiquid: number;      // colchón que NO se invierte
  monthlyFree: number;     // excedente del mes
  savingsPot: number;      // ahorro personal acumulado (referencia)
  rationale: string;
}

/**
 * Cuánto invertir según la situación:
 * - Mantén intacto el fondo de emergencia (3 meses de gastos esenciales).
 * - Invierte el excedente del mes + lo que exceda del ahorro personal por
 *   encima de ese colchón, de forma conservadora.
 */
export function investmentAdvice(concepts: Concept[]): InvestmentAdvice {
  const monthlyFree = Math.max(0, availableBalance(concepts));
  const essential = essentialExpenses(concepts);
  const targetCushion = essential * 3; // 3 meses de supervivencia
  const cushion = emergencyFund(concepts);
  const savingsPot = savings(concepts);

  // Excedente del ahorro por encima del colchón objetivo:
  const surplusFromSavings = Math.max(0, cushion - targetCushion);
  const investable = monthlyFree + surplusFromSavings;
  const keepLiquid = Math.min(cushion, targetCushion);

  const rationale = surplusFromSavings > 0
    ? `Tu fondo de emergencia ya cubre más de 3 meses de gastos esenciales. Puedes invertir el excedente del mes más lo que sobra del colchón, manteniendo intactos ${targetCushion.toLocaleString('es-CO')} COP de reserva.`
    : `Invierte el excedente del mes. Mantén tu fondo de emergencia creciendo hasta cubrir 3 meses de gastos esenciales (${targetCushion.toLocaleString('es-CO')} COP) antes de destinar ahorros a inversión.`;

  return { investable, keepLiquid, monthlyFree, savingsPot, rationale };
}
