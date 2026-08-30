<script lang="ts">
  import type { AgendaEvent, EventCategory } from '../domain/agenda/types';
  import { CATEGORY_COLORS } from '../domain/agenda/types';
  import { store } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import Icon from '../lib/Icon.svelte';

  let { event = null, onClose }: { event?: AgendaEvent | null; onClose: () => void } = $props();

  const CATS: EventCategory[] = ['Cumpleaños', 'Festivo', 'Personal', 'Trabajo', 'Otro'];
  let name = $state(event?.name ?? '');
  let date = $state(event?.date ?? new Date().toISOString().slice(0, 10));
  let time = $state(event?.time ?? '');
  let category = $state<EventCategory>(event?.category ?? 'Cumpleaños');
  let description = $state(event?.description ?? '');
  let reminder = $state(event?.reminder ?? true);

  async function save() {
    if (!name.trim() || !date) { toast.show('Completa nombre y fecha'); return; }
    const e: AgendaEvent = {
      id: event?.id ?? store.newId(),
      name: name.trim(), date, time: time || undefined, category,
      color: CATEGORY_COLORS[category], description: description.trim() || undefined, reminder,
    };
    await store.saveEvent(e);
    toast.show(event ? 'Evento actualizado' : 'Evento creado');
    onClose();
  }
  async function remove() {
    if (!event) return;
    await store.deleteEvent(event.id);
    toast.show('Evento eliminado');
    onClose();
  }
</script>

<div class="modal-back" onclick={(e) => e.target === e.currentTarget && onClose()} role="presentation">
  <div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <div><h3>{event ? 'Editar evento' : 'Nuevo evento'}</h3><p class="msub">Agenda personal</p></div>
      <button class="mini-btn" onclick={onClose} aria-label="Cerrar"><Icon name="x" size={16} /></button>
    </div>
    <div class="field"><label>Nombre del evento *</label><input bind:value={name} placeholder="Ej. Cumpleaños de Andrea" /></div>
    <div class="row2">
      <div class="field"><label>Fecha *</label><input type="date" bind:value={date} /></div>
      <div class="field"><label>Hora</label><input type="time" bind:value={time} /></div>
    </div>
    <div class="field"><label>Categoría</label>
      <select bind:value={category}>{#each CATS as c}<option value={c}>{c}</option>{/each}</select>
    </div>
    <div class="field"><label>Descripción</label><textarea bind:value={description} rows="2" placeholder="Opcional"></textarea></div>
    <button class="toggle" class:on={reminder} onclick={() => (reminder = !reminder)} type="button">
      <div class="sw"></div><span class="tt">Recordarme 1 día antes</span>
    </button>
    <div class="modal-actions">
      {#if event}<button class="btn danger" onclick={remove}>Eliminar</button>{/if}
      <button class="btn ghost" onclick={onClose}>Cancelar</button>
      <button class="btn primary" onclick={save}>{event ? 'Guardar' : 'Crear evento'}</button>
    </div>
  </div>
</div>
