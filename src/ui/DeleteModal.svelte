<script lang="ts">
  import type { Concept } from '../domain/finance/types';
  import { store } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';

  let { concept, onClose }: { concept: Concept; onClose: () => void } = $props();

  async function confirm() {
    await store.deleteConcept(concept.id);
    toast.show('Concepto eliminado');
    onClose();
  }
</script>

<div class="modal-back" onclick={(e) => e.target === e.currentTarget && onClose()} role="presentation">
  <div class="modal">
    <h3>Eliminar concepto</h3>
    <p class="msub">Esta acción archiva el concepto.</p>
    <div class="callout" style="border-color:var(--neg)">
      ¿Seguro que deseas eliminar <b>{concept.name}</b>? Su historial se conserva como registro (soft-delete), no se destruye.
    </div>
    <div class="modal-actions">
      <button class="btn ghost" onclick={onClose}>Cancelar</button>
      <button class="btn danger" onclick={confirm}>Eliminar</button>
    </div>
  </div>
</div>
