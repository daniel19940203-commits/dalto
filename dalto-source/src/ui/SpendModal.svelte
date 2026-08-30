<script lang="ts">
  import type { Spend, SpendCategory } from '../domain/finance/spend';
  import { SPEND_CATEGORIES, SPEND_COLORS } from '../domain/finance/spend';
  import { store } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import Icon from '../lib/Icon.svelte';

  let { spend = null, onClose }: { spend?: Spend | null; onClose: () => void } = $props();

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const today = new Date().toISOString().slice(0, 10);

  let amount = $state(spend ? String(spend.amount) : '');
  let date = $state(spend?.date ?? today);
  let month = $state(spend?.month ?? new Date().getMonth());
  let category = $state<SpendCategory>(spend?.category ?? 'Comida');
  let note = $state(spend?.note ?? '');

  async function save() {
    const amt = Number(amount) || 0;
    if (!amt) { toast.show('Ingresa la cantidad'); return; }
    const sp: Spend = {
      id: spend?.id ?? store.newId(),
      amount: amt, date, month, category, note: note.trim() || undefined,
    };
    await store.saveSpend(sp);
    toast.show(spend ? 'Gasto actualizado' : 'Gasto registrado');
    onClose();
  }
  async function remove() {
    if (!spend) return;
    await store.deleteSpend(spend.id);
    toast.show('Gasto eliminado');
    onClose();
  }
</script>

<div class="modal-back" onclick={(e) => e.target === e.currentTarget && onClose()} role="presentation">
  <div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <div><h3>{spend ? 'Editar gasto' : 'Registrar gasto'}</h3><p class="msub">Control de gasto</p></div>
      <button class="mini-btn" onclick={onClose} aria-label="Cerrar"><Icon name="x" size={16} /></button>
    </div>

    <div class="field"><label>Cantidad *</label><input bind:value={amount} inputmode="numeric" placeholder="0" /></div>
    <div class="row2">
      <div class="field"><label>Mes (consolidación)</label>
        <select bind:value={month}>{#each MONTHS as m, i}<option value={i}>{m}</option>{/each}</select></div>
      <div class="field"><label>Fecha (historial)</label><input type="date" bind:value={date} /></div>
    </div>
    <div class="field"><label>Categoría</label>
      <select bind:value={category}>{#each SPEND_CATEGORIES as c}<option value={c}>{c}</option>{/each}</select></div>
    <div class="field"><label>Nota</label><input bind:value={note} placeholder="Opcional (ej. Almuerzo con equipo)" /></div>

    <div class="modal-actions">
      {#if spend}<button class="btn danger" onclick={remove}>Eliminar</button>{/if}
      <button class="btn ghost" onclick={onClose}>Cancelar</button>
      <button class="btn primary" onclick={save}>{spend ? 'Guardar' : 'Registrar'}</button>
    </div>
  </div>
</div>
