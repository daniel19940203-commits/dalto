<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import Icon from '../lib/Icon.svelte';

  let { onClose }: { onClose: () => void } = $props();
  let pin = $state('');
  let confirm = $state('');
  let err = $state('');

  async function save() {
    if (pin.length < 4) { err = 'El PIN debe tener al menos 4 dígitos.'; return; }
    if (pin !== confirm) { err = 'Los PIN no coinciden.'; return; }
    await store.enablePin(pin);
    toast.show('Cifrado activado');
    onClose();
  }
</script>

<div class="modal-back" onclick={(e) => e.target === e.currentTarget && onClose()} role="presentation">
  <div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <div><h3>Activar bloqueo con PIN</h3><p class="msub">Cifrado en reposo de tus datos</p></div>
      <button class="mini-btn" onclick={onClose} aria-label="Cerrar"><Icon name="x" size={16} /></button>
    </div>
    <div class="callout">
      Tus datos se cifrarán en este dispositivo con una llave derivada de tu PIN. <b>Si olvidas el PIN no hay forma de recuperarlos</b> — guarda un respaldo JSON antes.
    </div>
    <div class="field"><label>PIN (mínimo 4 dígitos)</label>
      <input class="pin-input" bind:value={pin} inputmode="numeric" type="password" maxlength="12" /></div>
    <div class="field"><label>Confirmar PIN</label>
      <input class="pin-input" bind:value={confirm} inputmode="numeric" type="password" maxlength="12" /></div>
    {#if err}<div class="pin-err">{err}</div>{/if}
    <div class="modal-actions">
      <button class="btn ghost" onclick={onClose}>Cancelar</button>
      <button class="btn primary" onclick={save}>Activar cifrado</button>
    </div>
  </div>
</div>
