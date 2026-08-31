// ============================================================================
// IndexedDB vía Dexie — almacenamiento local-first.
// Todo vive en el dispositivo. Sin servidor, sin credenciales.
// ============================================================================
import Dexie, { type Table } from 'dexie';
import type { Concept } from '../domain/finance/types';
import type { AgendaEvent } from '../domain/agenda/types';
import type { Spend } from '../domain/finance/spend';

export interface SettingRow {
  key: string;
  value: unknown;
}

/** Sobre cifrado del snapshot completo (cuando el PIN/cifrado está activo). */
export interface OutboxOp {
  seq?: number;
  entity: 'concept' | 'event' | 'spend' | 'ledger';
  op: 'upsert' | 'delete';
  id: string;      // id o key (ledger)
  payload?: unknown;
  ts: string;
}

export class DaltoDB extends Dexie {
  concepts!: Table<Concept, string>;
  events!: Table<AgendaEvent, string>;
  spends!: Table<Spend, string>;
  outbox!: Table<OutboxOp, number>;
  settings!: Table<SettingRow, string>;

  constructor() {
    super('dalto');
    this.version(1).stores({
      // índices: solo lo que se consulta
      concepts: 'id, category, type, archived',
      events: 'id, date, category',
      settings: 'key',
      vault: 'id',
    });
    this.version(2).stores({
      spends: 'id, month, category, date',
    });
    this.version(3).stores({
      outbox: '++seq, entity',
    });
    this.version(4).stores({
      vault: null, // tabla del PIN eliminada (sistema de cifrado retirado)
    });
  }
}

export const db = new DaltoDB();

/**
 * Pide almacenamiento persistente para reducir el riesgo de que el navegador
 * evacúe IndexedDB bajo presión de espacio. Devuelve si quedó persistente.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage?.persist) {
    const already = await navigator.storage.persisted();
    return already || (await navigator.storage.persist());
  }
  return false;
}
