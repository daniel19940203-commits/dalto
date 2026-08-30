// ============================================================================
// Motor del Resumen: 7 bloques con subcategorías + Saldos consolidados
// ============================================================================
import type { Concept, Category, FinanceOptions, Frequency } from './types';
import { monthlyValue } from './autofill';
import { splitBiweekly } from './biweekly';
import { byCategory } from './calculations';

export type Macro = 'ing' | 'sal' | 'aho' | 'sdo';

export interface BlockDef {
  key: string;
  label: string;
  macro: Macro;
  sign: 1 | -1;
  category?: Category;
  saldos?: boolean;
}

/** Estructura fija de 7 bloques (orden del usuario). */
export const BLOCKS: BlockDef[] = [
  { key: 'income', label: 'Ingresos', macro: 'ing', sign: 1, category: 'income' },
  { key: 'fixed', label: 'Gastos fijos', macro: 'sal', sign: -1, category: 'fixed' },
  { key: 'memberships', label: 'Membresías y ocio', macro: 'sal', sign: -1, category: 'memberships' },
  { key: 'unexpected', label: 'Imprevistos', macro: 'sal', sign: -1, category: 'unexpected' },
  { key: 'provisions', label: 'Provisiones y ahorro', macro: 'aho', sign: -1, category: 'provisions' },
  { key: 'entertainment', label: 'Entretenimiento y diversión', macro: 'sal', sign: -1, category: 'entertainment' },
  { key: 'saldos', label: 'Saldos', macro: 'sdo', sign: 1, saldos: true },
];

/** Subcategorías estandarizadas por categoría. */
export const SUBCATS: Record<Category, string[]> = {
  income: ['Ingresos fijos', 'Ingresos variables'],
  fixed: ['Gastos de supervivencia', 'Obligaciones no esenciales'],
  memberships: ['Membresías', 'Ocio'],
  unexpected: ['Imprevistos'],
  provisions: ['Fondo de emergencia', 'Ahorro personal', 'Provisión'],
  entertainment: ['Entretenimiento y diversión', 'Control de gasto'],
  balances: ['Banca', 'Efectivo', 'Inversión'],
};

export interface Column {
  month: number;
  half?: 0 | 1;
  label: string;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Construye las columnas visibles a partir de meses seleccionados + periodo. */
export function buildColumns(months: number[], frequency: Frequency): Column[] {
  const sorted = [...months].sort((a, b) => a - b);
  const cols: Column[] = [];
  for (const m of sorted) {
    if (frequency === 'monthly') {
      cols.push({ month: m, label: MONTHS[m] });
    } else {
      cols.push({ month: m, half: 0, label: `${MONTHS[m]} 1` });
      cols.push({ month: m, half: 1, label: `${MONTHS[m]} 2` });
    }
  }
  return cols;
}

/** Valor de un concepto en una columna (respeta partición quincenal). */
export function conceptAtColumn(c: Concept, col: Column, opts: FinanceOptions): number {
  const { value } = monthlyValue(c, col.month, opts);
  if (col.half === undefined) return value;
  const [a, b] = splitBiweekly(value);
  return col.half === 0 ? a : b;
}

/** Subtotal de una subcategoría dentro de una categoría, en una columna. */
export function subcategoryTotal(
  concepts: Concept[],
  cat: Category,
  sub: string,
  col: Column,
  opts: FinanceOptions,
): number {
  return byCategory(concepts, cat)
    .filter((c) => c.type === sub)
    .reduce((s, c) => s + conceptAtColumn(c, col, opts), 0);
}

/** Total de una categoría en una columna. */
export function categoryTotal(
  concepts: Concept[],
  cat: Category,
  col: Column,
  opts: FinanceOptions,
): number {
  return byCategory(concepts, cat).reduce((s, c) => s + conceptAtColumn(c, col, opts), 0);
}

/** Flujo completo de un mes (para acumulados previos a la primera columna). */
function monthFlow(concepts: Concept[], m: number, opts: FinanceOptions, kind: 'disp' | 'aho'): number {
  const cat = (c: Category) =>
    byCategory(concepts, c).reduce((s, x) => s + monthlyValue(x, m, opts).value, 0);
  const income = cat('income');
  const salida = cat('fixed') + cat('memberships') + cat('unexpected') + cat('entertainment');
  const ahorro = cat('provisions');
  return kind === 'disp' ? income - salida - ahorro : ahorro;
}

export interface SaldosSeries {
  disponible: number[]; // flujo libre del periodo
  acumulado: number[]; // sobrante consolidado (running)
  ahorroAcumulado: number[]; // provisiones consolidadas (running)
  total: number[]; // acumulado + ahorroAcumulado (patrimonio)
}

/**
 * Series de Saldos consolidadas. Los acumulados arrancan desde el consolidado
 * de los meses ANTERIORES a la primera columna visible, de modo que si miras
 * solo "Ago" ya trae lo de Ene–Jul.
 */
export function saldos(concepts: Concept[], cols: Column[], opts: FinanceOptions): SaldosSeries {
  const disponible: number[] = [];
  const acumulado: number[] = [];
  const ahorroAcumulado: number[] = [];
  const total: number[] = [];

  // Ahorro total (lump) de provisiones: suma al pot desde su mes de inicio,
  // sin descontarse del disponible.
  const provisions = byCategory(concepts, 'provisions');
  const lumpUpTo = (m: number) =>
    provisions.filter((c) => (c.startMonth ?? 0) <= m).reduce((s, c) => s + (c.savingsTotal ?? 0), 0);

  const firstMonth = cols.length ? cols[0].month : 0;
  let accDisp = 0;
  let accAho = 0;
  for (let m = 0; m < firstMonth; m++) {
    accDisp += monthFlow(concepts, m, opts, 'disp');
    accAho += monthFlow(concepts, m, opts, 'aho');
  }

  for (const col of cols) {
    const income = categoryTotal(concepts, 'income', col, opts);
    const salida =
      categoryTotal(concepts, 'fixed', col, opts) +
      categoryTotal(concepts, 'memberships', col, opts) +
      categoryTotal(concepts, 'unexpected', col, opts) +
      categoryTotal(concepts, 'entertainment', col, opts);
    const ahorro = categoryTotal(concepts, 'provisions', col, opts);
    const disp = income - salida - ahorro;

    accDisp += disp;
    accAho += ahorro;
    const lump = lumpUpTo(col.month);
    disponible.push(disp);
    acumulado.push(accDisp);
    ahorroAcumulado.push(accAho + lump);
    total.push(accDisp + accAho + lump);
  }

  return { disponible, acumulado, ahorroAcumulado, total };
}
