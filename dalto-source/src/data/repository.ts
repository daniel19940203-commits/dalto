// ============================================================================
// Patrón Repository — la app habla con esta interfaz, no con IndexedDB.
// El día que se escale a la nube (Supabase), se cambia SOLO la implementación.
// ============================================================================
import type { Concept } from '../domain/finance/types';
import type { AgendaEvent } from '../domain/agenda/types';
import type { Spend } from '../domain/finance/spend';

export interface Snapshot {
  concepts: Concept[];
  events: AgendaEvent[];
  spends?: Spend[];
  payLedger?: Record<string, string>;
  settings: Record<string, unknown>;
  version: number;
  exportedAt: string;
}

export interface Repository {
  // Conceptos
  listConcepts(): Promise<Concept[]>;
  saveConcept(c: Concept): Promise<void>;
  deleteConcept(id: string, soft?: boolean): Promise<void>;
  // Eventos
  listEvents(): Promise<AgendaEvent[]>;
  saveEvent(e: AgendaEvent): Promise<void>;
  deleteEvent(id: string): Promise<void>;
  // Gastos
  listSpends(): Promise<Spend[]>;
  saveSpend(s: Spend): Promise<void>;
  deleteSpend(id: string): Promise<void>;
  // Ajustes
  getSetting<T>(key: string): Promise<T | undefined>;
  setSetting(key: string, value: unknown): Promise<void>;
  // Respaldo / restauración
  exportSnapshot(): Promise<Snapshot>;
  importSnapshot(s: Snapshot): Promise<void>;
}
