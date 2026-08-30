import { db } from './db';
import type { Repository, Snapshot } from './repository';
import type { Concept } from '../domain/finance/types';
import type { AgendaEvent } from '../domain/agenda/types';
import type { Spend } from '../domain/finance/spend';

const SCHEMA_VERSION = 1;

export class IndexedDbRepository implements Repository {
  async listConcepts(): Promise<Concept[]> {
    return db.concepts.filter((c) => !c.archived).toArray();
  }
  async saveConcept(c: Concept): Promise<void> {
    await db.concepts.put(c);
  }
  async deleteConcept(id: string, soft = true): Promise<void> {
    if (soft) {
      const c = await db.concepts.get(id);
      if (c) await db.concepts.put({ ...c, archived: true });
    } else {
      await db.concepts.delete(id);
    }
  }

  async listEvents(): Promise<AgendaEvent[]> {
    return db.events.toArray();
  }
  async saveEvent(e: AgendaEvent): Promise<void> {
    await db.events.put(e);
  }
  async deleteEvent(id: string): Promise<void> {
    await db.events.delete(id);
  }

  async listSpends(): Promise<Spend[]> { return db.spends.toArray(); }
  async saveSpend(s: Spend): Promise<void> { await db.spends.put(s); }
  async deleteSpend(id: string): Promise<void> { await db.spends.delete(id); }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const row = await db.settings.get(key);
    return row?.value as T | undefined;
  }
  async setSetting(key: string, value: unknown): Promise<void> {
    await db.settings.put({ key, value });
  }

  async exportSnapshot(): Promise<Snapshot> {
    const [concepts, events, spends, settingsRows] = await Promise.all([
      db.concepts.toArray(),
      db.events.toArray(),
      db.spends.toArray(),
      db.settings.toArray(),
    ]);
    const settings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
    return { concepts, events, spends, settings, version: SCHEMA_VERSION, exportedAt: new Date().toISOString() };
  }

  async importSnapshot(s: Snapshot): Promise<void> {
    await db.transaction('rw', db.concepts, db.events, db.spends, db.settings, async () => {
      await Promise.all([db.concepts.clear(), db.events.clear(), db.spends.clear(), db.settings.clear()]);
      await db.concepts.bulkPut(s.concepts);
      await db.events.bulkPut(s.events);
      if (s.spends) await db.spends.bulkPut(s.spends);
      await db.settings.bulkPut(Object.entries(s.settings).map(([key, value]) => ({ key, value })));
    });
  }
}

export const repository = new IndexedDbRepository();
