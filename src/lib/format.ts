import type { Frequency } from '../domain/finance/types';
export function freqLabel(f: Frequency): string {
  return f === 'monthly' ? 'mensual' : f === 'semiMonthly' ? 'quincenal' : f;
}
