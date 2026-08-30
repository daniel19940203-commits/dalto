import type { Concept } from '../domain/finance/types';
import type { AgendaEvent } from '../domain/agenda/types';
import type { Spend } from '../domain/finance/spend';
import { spendConcepts } from '../domain/finance/spend';
import type { Currency } from './money';
import type { Snapshot } from '../data/repository';
import { repository } from '../data/indexeddb-repo';
import { db, requestPersistentStorage } from '../data/db';
import { encryptJSON, decryptJSON, hashPin } from '../data/crypto';

type Screen = 'welcome' | 'register' | 'pin' | 'menu' | 'shell';
type View =
  | 'overview' | 'summary' | 'advisor'
  | 'c_income' | 'c_fixed' | 'c_memberships' | 'c_unexpected'
  | 'c_provisions' | 'c_entertainment' | 'c_balances'
  | 'events' | 'calendar' | 'settings' | 'spends';

const SCHEMA_VERSION = 1;

export interface Account {
  name: string;
  phone: string;
  pinHash: string;
}

class AppStore {
  screen = $state<Screen>('welcome');
  view = $state<View>('overview');
  ready = $state(false);

  account = $state<Account | null>(null);
  loggedIn = $state(false);
  remember = $state(false);

  concepts = $state<Concept[]>([]);
  events = $state<AgendaEvent[]>([]);
  spends = $state<Spend[]>([]);

  currency = $state<Currency>('COP');
  theme = $state<'dark' | 'light'>('dark');
  period = $state<'monthly' | 'semiMonthly'>('monthly');
  autofill = $state(true);

  // Cifrado opcional avanzado (independiente del PIN de entrada)
  pinEnabled = $state(false);
  locked = $state(false);
  private pin: string | null = null;

  get userName(): string { return this.account?.name ?? ''; }
  /** Conceptos + gasto real (bloques sintéticos de Entretenimiento). */
  get effectiveConcepts(): Concept[] { return [...this.concepts, ...spendConcepts(this.spends)]; }

  async init() {
    await requestPersistentStorage();
    await this.loadPrefs();
    document.documentElement.setAttribute('data-theme', this.theme);
    this.account = (await repository.getSetting<Account>('account')) ?? null;
    this.remember = (await repository.getSetting<boolean>('remember')) ?? false;
    // Recordar PIN: si está activo y hay cuenta, entra directo sin pedir PIN.
    if (this.account && this.remember) { this.loggedIn = true; this.screen = 'menu'; }

    const secure = (await repository.getSetting<boolean>('secure')) ?? false;
    this.pinEnabled = secure;
    if (secure) { this.locked = true; this.ready = true; return; }

    // Sin cuenta = sin dueño: limpia cualquier dato residual (incluida la
    // data de ejemplo de versiones anteriores). Los datos solo existen si
    // el dueño de la cuenta los ingresó tras registrarse.
    if (!this.account) {
      await db.concepts.clear();
      await db.events.clear();
      await db.spends.clear();
    }

    await this.reload();
    this.ready = true;
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
  }

  goScreen(s: Screen) { this.screen = s; }
  go(v: View) { this.view = v; }
  newId(): string { return crypto.randomUUID?.() ?? String(Date.now() + Math.random()); }

  // ---- cuenta ----
  async register(name: string, phone: string, pin: string, remember = false) {
    const acc: Account = { name: name.trim(), phone: phone.trim(), pinHash: await hashPin(pin) };
    await repository.setSetting('account', acc);
    this.account = acc;
    this.remember = remember;
    await repository.setSetting('remember', remember);
    this.loggedIn = true;
  }
  async login(pin: string, remember = false): Promise<boolean> {
    if (!this.account) return false;
    const ok = (await hashPin(pin)) === this.account.pinHash;
    if (ok) {
      this.loggedIn = true;
      this.remember = remember;
      await repository.setSetting('remember', remember);
    }
    return ok;
  }
  async logout() {
    this.loggedIn = false;
    this.remember = false;
    await repository.setSetting('remember', false);
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
    const env = await encryptJSON({ concepts: this.concepts, events: this.events, spends: this.spends }, this.pin);
    await db.vault.put({ id: 'vault', envelope: env, updatedAt: new Date().toISOString() });
  }

  async saveConcept(c: Concept) {
    if (this.pinEnabled) {
      const i = this.concepts.findIndex((x) => x.id === c.id);
      this.concepts = i >= 0 ? this.concepts.map((x) => (x.id === c.id ? c : x)) : [...this.concepts, c];
      await this.persistVault();
    } else { await repository.saveConcept(c); await this.reload(); }
  }
  async deleteConcept(id: string) {
    if (this.pinEnabled) { this.concepts = this.concepts.filter((x) => x.id !== id); await this.persistVault(); }
    else { await repository.deleteConcept(id, true); await this.reload(); }
  }

  async saveEvent(e: AgendaEvent) {
    if (this.pinEnabled) {
      const i = this.events.findIndex((x) => x.id === e.id);
      this.events = i >= 0 ? this.events.map((x) => (x.id === e.id ? e : x)) : [...this.events, e];
      await this.persistVault();
    } else { await repository.saveEvent(e); await this.reload(); }
  }
  async deleteEvent(id: string) {
    if (this.pinEnabled) { this.events = this.events.filter((x) => x.id !== id); await this.persistVault(); }
    else { await repository.deleteEvent(id); await this.reload(); }
  }

  async saveSpend(sp: Spend) {
    if (this.pinEnabled) {
      const i = this.spends.findIndex((x) => x.id === sp.id);
      this.spends = i >= 0 ? this.spends.map((x) => (x.id === sp.id ? sp : x)) : [...this.spends, sp];
      await this.persistVault();
    } else { await repository.saveSpend(sp); await this.reload(); }
  }
  async deleteSpend(id: string) {
    if (this.pinEnabled) { this.spends = this.spends.filter((x) => x.id !== id); await this.persistVault(); }
    else { await repository.deleteSpend(id); await this.reload(); }
  }

  // ---- cifrado avanzado opcional ----
  async enablePin(pin: string) {
    this.pin = pin;
    await this.persistVault();
    await db.concepts.clear(); await db.events.clear();
    await repository.setSetting('secure', true);
    this.pinEnabled = true;
  }
  async disablePin() {
    if (!this.pin) return;
    await db.concepts.clear(); await db.events.clear();
    await db.concepts.bulkPut(this.concepts);
    await db.events.bulkPut(this.events);
    await db.vault.delete('vault');
    await repository.setSetting('secure', false);
    this.pinEnabled = false; this.pin = null;
  }
  async unlock(pin: string): Promise<boolean> {
    const row = await db.vault.get('vault');
    if (!row) return false;
    try {
      const data = await decryptJSON<{ concepts: Concept[]; events: AgendaEvent[]; spends?: Spend[] }>(row.envelope, pin);
      this.concepts = data.concepts ?? [];
      this.events = data.events ?? [];
      this.spends = data.spends ?? [];
      this.pin = pin; this.locked = false;
      return true;
    } catch { return false; }
  }

  // ---- reset ----
  async resetAll(): Promise<void> {
    this.concepts = [];
    this.events = [];
    this.spends = [];
    if (this.pinEnabled) await this.persistVault();
    else { await db.concepts.clear(); await db.events.clear(); await db.spends.clear(); }
  }

  // ---- respaldo ----
  buildSnapshot(): Snapshot {
    return {
      concepts: this.concepts, events: this.events, spends: this.spends,
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
    if (this.pinEnabled) await this.persistVault();
    else await repository.importSnapshot(parsed);
    const s: any = parsed.settings ?? {};
    if (s.currency) await this.setCurrency(s.currency);
    if (s.theme) await this.setTheme(s.theme);
    if (s.period) await this.setPeriod(s.period);
    if (typeof s.autofill === 'boolean') await this.setAutofill(s.autofill);
  }
}

export const store = new AppStore();
