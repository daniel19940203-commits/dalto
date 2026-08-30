<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import Icon from '../lib/Icon.svelte';

  let { onClose }: { onClose: () => void } = $props();
  let working = $state(false);

  async function confirm() {
    working = true;
    await store.resetAll();
    toast.show('Todo restablecido a cero');
    onClose();
  }
</script>

<div class="modal-back" onclick={(e) => e.target === e.currentTarget && onClose()} role="presentation">
  <div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <div><h3>Restablecer todo</h3><p class="msub">Acción irreversible</p></div>
      <button class="mini-btn" onclick={onClose} aria-label="Cerrar"><Icon name="x" size={16} /></button>
    </div>
    <div class="callout" style="border-color:var(--neg)">
      ¿Seguro que deseas restablecer? Se <b>eliminarán todos los conceptos y eventos</b> y los valores volverán a <b>0</b>. Esta acción no se puede deshacer.
      {#if !store.pinEnabled}<br><br>Si quieres conservar una copia, cancela y exporta un respaldo JSON primero.{/if}
    </div>
    <div class="modal-actions">
      <button class="btn ghost" onclick={onClose} disabled={working}>Cancelar</button>
      <button class="btn danger" onclick={confirm} disabled={working}>{working ? 'Restableciendo…' : 'Sí, restablecer todo'}</button>
    </div>
  </div>
</div>
