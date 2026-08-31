// ============================================================================
// Acceso a datos en la nube (Supabase), acotado al usuario autenticado.
// Traduce entre los campos de la app (camelCase) y las columnas (snake_case).
// ============================================================================
import { supabase } from '../lib/supabase';
import type { Concept } from '../domain/finance/types';
import type { AgendaEvent } from '../domain/agenda/types';
import type { Spend } from '../domain/finance/spend';

async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ---- mapeos ----
function conceptToRow(c: Concept, userId: string) {
  return {
    id: c.id, user_id: userId, name: c.name, category: c.category, type: c.type ?? null,
    kind: c.kind ?? null, frequency: c.frequency ?? null, amount: c.amount,
    installments: c.installments ?? null, total_installments: c.totalInstallments ?? null,
    principal: c.principal ?? null, savings_total: c.savingsTotal ?? null,
    monthly_increase: c.monthlyIncrease ?? null, start_month: c.startMonth ?? null,
    recurring: c.recurring ?? null, description: c.description ?? null,
    archived: c.archived ?? false, updated_at: c.updatedAt ?? new Date().toISOString(),
  };
}
function rowToConcept(r: any): Concept {
  return {
    id: r.id, name: r.name, category: r.category, type: r.type, kind: r.kind,
    frequency: r.frequency, amount: Number(r.amount),
    installments: r.installments ?? undefined, totalInstallments: r.total_installments ?? undefined,
    principal: r.principal ?? undefined, savingsTotal: r.savings_total ?? undefined,
    monthlyIncrease: r.monthly_increase ?? undefined, startMonth: r.start_month ?? undefined,
    recurring: r.recurring ?? undefined, description: r.description ?? undefined,
    archived: r.archived ?? undefined, updatedAt: r.updated_at ?? undefined,
  };
}
function eventToRow(e: AgendaEvent, userId: string) {
  return {
    id: e.id, user_id: userId, name: e.name, date: e.date, time: e.time ?? null,
    category: e.category ?? null, color: e.color ?? null, description: e.description ?? null,
    reminder: e.reminder ?? false, updated_at: e.updatedAt ?? new Date().toISOString(),
  };
}
function rowToEvent(r: any): AgendaEvent {
  return {
    id: r.id, name: r.name, date: r.date, time: r.time ?? undefined, category: r.category,
    color: r.color, description: r.description ?? undefined, reminder: r.reminder ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}
function spendToRow(s: Spend, userId: string) {
  return {
    id: s.id, user_id: userId, amount: s.amount, date: s.date, month: s.month,
    category: s.category ?? null, note: s.note ?? null,
    updated_at: s.updatedAt ?? new Date().toISOString(),
  };
}
function rowToSpend(r: any): Spend {
  return {
    id: r.id, amount: Number(r.amount), date: r.date, month: r.month,
    category: r.category, note: r.note ?? undefined, updatedAt: r.updated_at ?? undefined,
  };
}

export interface CloudSnapshot {
  concepts: Concept[];
  events: AgendaEvent[];
  spends: Spend[];
  ledger: { key: string; status: string; updatedAt: string }[];
}

/** Descarga todo lo del usuario. */
export async function cloudFetchAll(): Promise<CloudSnapshot | null> {
  const userId = await uid();
  if (!userId) return null;
  const [c, e, s, l] = await Promise.all([
    supabase.from('concepts').select('*').eq('user_id', userId),
    supabase.from('events').select('*').eq('user_id', userId),
    supabase.from('spends').select('*').eq('user_id', userId),
    supabase.from('pay_ledger').select('*').eq('user_id', userId),
  ]);
  if (c.error || e.error || s.error || l.error) throw (c.error || e.error || s.error || l.error);
  return {
    concepts: (c.data ?? []).map(rowToConcept),
    events: (e.data ?? []).map(rowToEvent),
    spends: (s.data ?? []).map(rowToSpend),
    ledger: (l.data ?? []).map((r: any) => ({ key: r.key, status: r.status, updatedAt: r.updated_at })),
  };
}

export async function cloudUpsertConcept(c: Concept) {
  const userId = await uid(); if (!userId) throw new Error('no-session');
  const { error } = await supabase.from('concepts').upsert(conceptToRow(c, userId));
  if (error) throw error;
}
export async function cloudUpsertEvent(e: AgendaEvent) {
  const userId = await uid(); if (!userId) throw new Error('no-session');
  const { error } = await supabase.from('events').upsert(eventToRow(e, userId));
  if (error) throw error;
}
export async function cloudUpsertSpend(s: Spend) {
  const userId = await uid(); if (!userId) throw new Error('no-session');
  const { error } = await supabase.from('spends').upsert(spendToRow(s, userId));
  if (error) throw error;
}
export async function cloudUpsertLedger(key: string, status: string, updatedAt: string) {
  const userId = await uid(); if (!userId) throw new Error('no-session');
  const { error } = await supabase.from('pay_ledger').upsert({ user_id: userId, key, status, updated_at: updatedAt });
  if (error) throw error;
}
export async function cloudDelete(table: 'concepts' | 'events' | 'spends', id: string) {
  const userId = await uid(); if (!userId) throw new Error('no-session');
  const { error } = await supabase.from(table).delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}
export async function cloudDeleteLedger(key: string) {
  const userId = await uid(); if (!userId) throw new Error('no-session');
  const { error } = await supabase.from('pay_ledger').delete().eq('user_id', userId).eq('key', key);
  if (error) throw error;
}

/** Sube TODO lo local a la nube (migración inicial). */
export async function cloudPushAll(snap: {
  concepts: Concept[]; events: AgendaEvent[]; spends: Spend[]; ledger: { key: string; status: string; updatedAt: string }[];
}) {
  const userId = await uid(); if (!userId) throw new Error('no-session');
  if (snap.concepts.length) {
    const { error } = await supabase.from('concepts').upsert(snap.concepts.map((c) => conceptToRow(c, userId)));
    if (error) throw error;
  }
  if (snap.events.length) {
    const { error } = await supabase.from('events').upsert(snap.events.map((e) => eventToRow(e, userId)));
    if (error) throw error;
  }
  if (snap.spends.length) {
    const { error } = await supabase.from('spends').upsert(snap.spends.map((s) => spendToRow(s, userId)));
    if (error) throw error;
  }
  if (snap.ledger.length) {
    const { error } = await supabase.from('pay_ledger').upsert(
      snap.ledger.map((x) => ({ user_id: userId, key: x.key, status: x.status, updated_at: x.updatedAt })),
    );
    if (error) throw error;
  }
}
