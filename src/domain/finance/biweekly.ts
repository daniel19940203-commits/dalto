// ============================================================================
// Regla quincenal (semi-monthly) — NO es "cada 14 días".
// Periodo 1: día 1 → 15
// Periodo 2: día 16 → último día del mes
// ============================================================================

export interface Half {
  index: 0 | 1;
  startDay: number;
  endDay: number;
}

/** Devuelve las dos quincenas de un mes según el calendario real. */
export function biweeklyHalves(year: number, month: number): [Half, Half] {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return [
    { index: 0, startDay: 1, endDay: 15 },
    { index: 1, startDay: 16, endDay: lastDay },
  ];
}

/**
 * Reparte un monto mensual en dos quincenas de forma estable (sin perder pesos
 * por redondeo): la primera lleva el redondeo, la segunda el resto.
 */
export function splitBiweekly(monthlyAmount: number): [number, number] {
  const first = Math.round(monthlyAmount / 2);
  return [first, monthlyAmount - first];
}
