// ============================================================================
// Formato de moneda. Cambiar de moneda NO altera valores almacenados (COP).
// Si no hay tasa FX explícita, no se convierte.
// ============================================================================
export type Currency = 'COP' | 'USD';

/** Formatea un monto en COP (base) según la moneda de visualización. */
export function formatMoney(cop: number, currency: Currency, fxRate?: number): string {
  const negative = cop < 0;
  const abs = Math.abs(cop);
  let out: string;
  if (currency === 'USD') {
    if (!fxRate) return `${negative ? '−' : ''}COP ${new Intl.NumberFormat('es-CO').format(abs)}`;
    out = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(abs / fxRate);
  } else {
    out = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(abs);
  }
  return (negative ? '−' : '') + out;
}
