import type { Concept } from '../domain/finance/types';
import type { AgendaEvent } from '../domain/agenda/types';
import type { Spend } from '../domain/finance/spend';
import { spendConcepts } from '../domain/finance/spend';
import type { PayLedger, PayStatus } from '../domain/finance/payments';
import { payKey } from '../domain/finance/payments';
import type { Currency } from './money';
import type { Snapshot } from '../data/repository';
import { repository } from '../data/indexeddb-repo';
import { db, requestPersistentStorage } from '../data/db';
import { encryptJSON } from '../data/crypto';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import type { OutboxOp } from '../data/db';
import {
  cloudFetchAll, cloudUpsertConcept, cloudUpsertEvent, cloudUpsertSpend, cloudUpsertLedger,
  cloudDelete, cloudDeleteLedger, cloudPushAll,
} from '../data/cloud';

type OutEntity = 'concept' | 'event' | 'spend' | 'ledger';
type SyncState = 'idle' | 'syncing' | 'pending' | 'offline' | 'error';

type Screen = 'welcome' | 'register' | 'login' | 'verify' | 'forgot' | 'menu' | 'shell';
type View =
  | 'overview' | 'summary' | 'advisor'
  | 'c_income' | 'c_fixed' | 'c_memberships' | 'c_unexpected'
  | 'c_provisions' | 'c_entertainment' | 'c_balances'
  | 'events' | 'calendar' | 'settings' | 'spends' | 'payments';

const SCHEMA_VERSION = 1;

export type AuthStatus = 'loading' | 'signedOut' | 'needsVerification' | 'signedIn';

export interface Account {
  email: string;
  name: string;
  phone: string;
}

class AppStore {
  screen = $state<Screen>('welcome');
  view = $state<View>('overview');
  ready = $state(false);

  account = $state<Account | null>(null);
  authStatus = $state<AuthStatus>('loading');
  pendingEmail = $state('');

  concepts = $state<Concept[]>([]);
  events = $state<AgendaEvent[]>([]);
  spends = $state<Spend[]>([]);
  payLedger = $state<PayLedger>({});
  payLedgerMeta = $state<Record<string, string>>({});

  syncState = $state<SyncState>('idle');
  lastSync = $state<string>('');

  currency = $state<Currency>('COP');
  theme = $state<'dark' | 'light'>('dark');
  period = $state<'monthly' | 'semiMonthly'>('monthly');
  autofill = $state(true);

  // Cifrado local (desactivado en el modelo nube; se conserva el motor)
  pinEnabled = $state(false);
  private pin: string | null = null;

  get userName(): string { return this.account?.name ?? ''; }
  get loggedIn(): boolean { return this.authStatus === 'signedIn'; }
  /** Conceptos + gasto real (bloques sintéticos de Entretenimiento). */
  get effectiveConcepts(): Concept[] { return [...this.concepts, ...spendConcepts(this.spends)]; }

  async init() {
    await requestPersistentStorage();
    await this.loadPrefs();
    document.documentElement.setAttribute('data-theme', this.theme);

    const { data } = await supabase.auth.getSession();
    this.applySession(data.session);
    supabase.auth.onAuthStateChange((_e, session) => this.applySession(session));

    await this.reload();
    this.ready = true;

    // Sincronización: al entrar (si hay sesión) y cuando vuelva la conexión.
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncNow());
    }
    if (this.authStatus === 'signedIn') this.syncNow();
  }

  private applySession(session: Session | null) {
    const user = session?.user ?? null;
    if (!user) { this.account = null; this.authStatus = 'signedOut'; return; }
    if (!user.email_confirmed_at) {
      this.authStatus = 'needsVerification';
      this.pendingEmail = user.email ?? '';
      return;
    }
    const meta = (user.user_metadata ?? {}) as { name?: string; phone?: string };
    this.account = { email: user.email ?? '', name: meta.name ?? '', phone: meta.phone ?? '' };
    this.authStatus = 'signedIn';
    if (['welcome', 'login', 'register', 'verify', 'forgot'].includes(this.screen)) this.screen = 'menu';
    this.syncNow();
  }

  private async loadPrefs() {
    this.currency = (await repository.getSetting<Currency>('currency')) ?? 'COP';
    this.theme = (await repository.getSetting<'dark' | 'light'>('theme')) ?? 'dark';
    this.period = (await repository.getSetting<'monthly' | 'semiMonthly'>('period')) ?? 'monthly';
    this.autofill = (await repository.getSetting<boolean>('autofill')) ?? true;
  }

  async reload() {
    this.concepts = await repository.listConcepts();
    this.events = await repository.listEvents();
    this.spends = await repository.listSpends();
    this.payLedger = (await repository.getSetting<PayLedger>('payLedger')) ?? {};
    this.payLedgerMeta = (await repository.getSetting<Record<string, string>>('payLedgerMeta')) ?? {};
  }

  goScreen(s: Screen) { this.screen = s; }
  go(v: View) { this.view = v; }
  newId(): string { return crypto.randomUUID?.() ?? String(Date.now() + Math.random()); }

  // ---- autenticación (Supabase) ----
  async register(email: string, password: string, name: string, phone: string) {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), phone: phone.trim() }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    this.pendingEmail = email.trim();
    this.authStatus = 'needsVerification';
    this.screen = 'verify';
  }

  async login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (/confirm/i.test(error.message)) {
        this.pendingEmail = email.trim();
        this.authStatus = 'needsVerification';
        this.screen = 'verify';
        return;
      }
      throw error;
    }
  }

  async resendVerification() {
    if (!this.pendingEmail) return;
    await supabase.auth.resend({ type: 'signup', email: this.pendingEmail });
  }

  async requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (error) throw error;
  }

  async logout() {
    await supabase.auth.signOut();
    this.account = null;
    this.authStatus = 'signedOut';
    this.screen = 'welcome';
  }

  // ---- preferencias ----
  async setCurrency(c: Currency) { this.currency = c; await repository.setSetting('currency', c); }
  async setPeriod(p: 'monthly' | 'semiMonthly') { this.period = p; await repository.setSetting('period', p); }
  async setAutofill(v: boolean) { this.autofill = v; await repository.setSetting('autofill', v); }
  async setTheme(t: 'dark' | 'light') {
    this.theme = t; document.documentElement.setAttribute('data-theme', t);
    await repository.setSetting('theme', t);
  }

  private async persistVault() {
    if (!this.pin) return;
    const env = await encryptJSON({ concepts: this.concepts, events: this.events, spends: this.spends, payLedger: this.payLedger }, this.pin);
    await db.vault.put({ id: 'vault', envelope: env, updatedAt: new Date().toISOString() });
  }

  // ---- cola offline + intento de escritura en la nube ----
  private online(): boolean { return typeof navigator === 'undefined' ? true : navigator.onLine; }

  private async cloudTry(entity: OutEntity, op: 'upsert' | 'delete', id: string, payload?: unknown) {
    if (this.authStatus !== 'signedIn' || !this.online()) {
      await db.outbox.add({ entity, op, id, payload, ts: new Date().toISOString() });
      this.syncState = 'pending';
      return;
    }
    try {
      await this.runCloudOp(entity, op, id, payload);
    } catch {
      await db.outbox.add({ entity, op, id, payload, ts: new Date().toISOString() });
      this.syncState = 'pending';
    }
  }

  private async runCloudOp(entity: OutEntity, op: 'upsert' | 'delete', id: string, payload?: unknown) {
    if (entity === 'concept') op === 'upsert' ? await cloudUpsertConcept(payload as Concept) : await cloudDelete('concepts', id);
    else if (entity === 'event') op === 'upsert' ? await cloudUpsertEvent(payload as AgendaEvent) : await cloudDelete('events', id);
    else if (entity === 'spend') op === 'upsert' ? await cloudUpsertSpend(payload as Spend) : await cloudDelete('spends', id);
    else if (entity === 'ledger') {
      if (op === 'upsert') { const p = payload as { status: string; updatedAt: string }; await cloudUpsertLedger(id, p.status, p.updatedAt); }
      else await cloudDeleteLedger(id);
    }
  }

  async saveConcept(c: Concept) {
    c.updatedAt = new Date().toISOString();
    await repository.saveConcept(c);
    await this.reload();
    await this.cloudTry('concept', 'upsert', c.id, c);
  }
  async deleteConcept(id: string) {
    await repository.deleteConcept(id, true); // soft-delete (archived) local
    const arch = await db.concepts.get(id);
    await this.reload();
    if (arch) await this.cloudTry('concept', 'upsert', id, arch); // nube: archivado
  }

  async saveEvent(e: AgendaEvent) {
    e.updatedAt = new Date().toISOString();
    await repository.saveEvent(e);
    await this.reload();
    await this.cloudTry('event', 'upsert', e.id, e);
  }
  async deleteEvent(id: string) {
    await repository.deleteEvent(id);
    await this.reload();
    await this.cloudTry('event', 'delete', id);
  }

  async saveSpend(sp: Spend) {
    sp.updatedAt = new Date().toISOString();
    await repository.saveSpend(sp);
    await this.reload();
    await this.cloudTry('spend', 'upsert', sp.id, sp);
  }
  async deleteSpend(id: string) {
    await repository.deleteSpend(id);
    await this.reload();
    await this.cloudTry('spend', 'delete', id);
  }

  async setPayStatus(conceptId: string, year: number, month: number, status: PayStatus) {
    const key = payKey(conceptId, year, month);
    const now = new Date().toISOString();
    const next = { ...this.payLedger };
    const meta = { ...this.payLedgerMeta };
    if (status === 'pending') { delete next[key]; delete meta[key]; }
    else { next[key] = status; meta[key] = now; }
    this.payLedger = next;
    this.payLedgerMeta = meta;
    await repository.setSetting('payLedger', next);
    await repository.setSetting('payLedgerMeta', meta);
    if (status === 'pending') await this.cloudTry('ledger', 'delete', key);
    else await this.cloudTry('ledger', 'upsert', key, { status, updatedAt: now });
  }

  // ---- sincronización nube ----
  private tsOf(x: { updatedAt?: string } | undefined): number {
    return x?.updatedAt ? Date.parse(x.updatedAt) : 0;
  }

  private async flushOutbox() {
    if (!this.online() || this.authStatus !== 'signedIn') return;
    const ops = await db.outbox.orderBy('seq').toArray();
    for (const op of ops) {
      try { await this.runCloudOp(op.entity, op.op, op.id, op.payload); await db.outbox.delete(op.seq!); }
      catch { break; }
    }
  }

  private async mergeEntity(entity: 'concept' | 'event' | 'spend', cloudRows: any[]) {
    const table = entity === 'concept' ? db.concepts : entity === 'event' ? db.events : db.spends;
    const local = await table.toArray();
    const cloudMap = new Map(cloudRows.map((r) => [r.id, r]));
    for (const cr of cloudRows) {
      const lr = local.find((x) => x.id === cr.id);
      if (!lr || this.tsOf(cr) > this.tsOf(lr)) await (table as any).put(cr);
    }
    for (const lr of local) {
      const cr = cloudMap.get(lr.id);
      if (!cr || this.tsOf(lr) > this.tsOf(cr)) await this.runCloudOp(entity, 'upsert', lr.id, lr);
    }
  }

  private async mergeLedger(cloudLedger: { key: string; status: string; updatedAt: string }[]) {
    const ledger = { ...this.payLedger };
    const meta = { ...this.payLedgerMeta };
    const cloudMap = new Map(cloudLedger.map((x) => [x.key, x]));
    for (const cx of cloudLedger) {
      const lts = meta[cx.key] ? Date.parse(meta[cx.key]) : 0;
      if (Date.parse(cx.updatedAt) > lts) { ledger[cx.key] = cx.status as any; meta[cx.key] = cx.updatedAt; }
    }
    for (const key of Object.keys(ledger)) {
      const cx = cloudMap.get(key);
      const lts = meta[key] ? Date.parse(meta[key]) : 0;
      if (!cx || lts > Date.parse(cx.updatedAt)) {
        await this.runCloudOp('ledger', 'upsert', key, { status: ledger[key], updatedAt: meta[key] || new Date().toISOString() });
      }
    }
    this.payLedger = ledger;
    this.payLedgerMeta = meta;
    await repository.setSetting('payLedger', ledger);
    await repository.setSetting('payLedgerMeta', meta);
  }

  async syncNow() {
    if (this.authStatus !== 'signedIn') return;
    if (!this.online()) { this.syncState = 'offline'; return; }
    this.syncState = 'syncing';
    try {
      await this.flushOutbox();
      const cloud = await cloudFetchAll();
      if (!cloud) { this.syncState = 'error'; return; }
      await this.mergeEntity('concept', cloud.concepts);
      await this.mergeEntity('event', cloud.events);
      await this.mergeEntity('spend', cloud.spends);
      await this.mergeLedger(cloud.ledger);
      await this.reload();
      this.lastSync = new Date().toISOString();
      this.syncState = (await db.outbox.count()) > 0 ? 'pending' : 'idle';
    } catch {
      this.syncState = 'error';
    }
  }

  /** Botón "Subir mis datos": empuja todo lo local a la nube y sincroniza. */
  async migrateLocalToCloud(): Promise<boolean> {
    if (!this.online() || this.authStatus !== 'signedIn') { this.syncState = 'offline'; return false; }
    this.syncState = 'syncing';
    try {
      const concepts = await db.concepts.toArray();
      const events = await db.events.toArray();
      const spends = await db.spends.toArray();
      const ledger = Object.keys(this.payLedger).map((k) => ({
        key: k, status: this.payLedger[k], updatedAt: this.payLedgerMeta[k] || new Date().toISOString(),
      }));
      await cloudPushAll({ concepts, events, spends, ledger });
      await this.syncNow();
      return true;
    } catch {
      this.syncState = 'error';
      return false;
    }
  }

  // ---- reset ----
  async resetAll(): Promise<void> {
    this.concepts = [];
    this.events = [];
    this.spends = [];
    this.payLedger = {};
    if (this.pinEnabled) {
      await this.persistVault();
    } else {
      await db.concepts.clear();
      await db.events.clear();
      await db.spends.clear();
      await repository.setSetting('payLedger', {});
    }
  }

  // ---- respaldo ----
  buildSnapshot(): Snapshot {
    return {
      concepts: this.concepts, events: this.events, spends: this.spends, payLedger: this.payLedger,
      settings: { currency: this.currency, theme: this.theme, period: this.period, autofill: this.autofill },
      version: SCHEMA_VERSION, exportedAt: new Date().toISOString(),
    };
  }
  exportBackup() {
    const blob = new Blob([JSON.stringify(this.buildSnapshot(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dalto-backup.json'; a.click();
    URL.revokeObjectURL(url);
  }
  async importBackup(file: File): Promise<void> {
    const parsed = JSON.parse(await file.text()) as Snapshot;
    if (!parsed || !Array.isArray(parsed.concepts) || !Array.isArray(parsed.events))
      throw new Error('Archivo de respaldo no válido.');
    this.concepts = parsed.concepts;
    this.events = parsed.events;
    this.spends = (parsed as any).spends ?? [];
    this.payLedger = (parsed as any).payLedger ?? {};
    if (this.pinEnabled) {
      await this.persistVault();
    } else {
      await repository.importSnapshot(parsed);
      await repository.setSetting('payLedger', this.payLedger);
    }
    const s: any = parsed.settings ?? {};
    if (s.currency) await this.setCurrency(s.currency);
    if (s.theme) await this.setTheme(s.theme);
    if (s.period) await this.setPeriod(s.period);
    if (typeof s.autofill === 'boolean') await this.setAutofill(s.autofill);
  }
}

export const store = new AppStore();
