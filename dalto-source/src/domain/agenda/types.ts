export type EventCategory = 'Cumpleaños' | 'Festivo' | 'Personal' | 'Trabajo' | 'Otro';

export interface AgendaEvent {
  id: string;
  name: string;
  date: string; // ISO YYYY-MM-DD
  time?: string; // HH:mm
  category: EventCategory;
  color: string;
  description?: string;
  reminder?: boolean; // aviso 1 día antes (se muestra al abrir la app)
}

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  Cumpleaños: '#e5546a',
  Festivo: '#f39f5a',
  Personal: '#4fd1c5',
  Trabajo: '#ae445a',
  Otro: '#8b83a3',
};

/** Días restantes entre hoy y una fecha ISO. */
export function daysUntil(dateISO: string, today = new Date()): number {
  const d = new Date(dateISO + 'T00:00:00');
  const t = new Date(today.toDateString());
  return Math.round((new Date(d.toDateString()).getTime() - t.getTime()) / 86_400_000);
}

/** Eventos con recordatorio que caen mañana (para avisar al abrir la app). */
export function remindersForTomorrow(events: AgendaEvent[], today = new Date()): AgendaEvent[] {
  return events.filter((e) => e.reminder && daysUntil(e.date, today) === 1);
}
