<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import Starfield from './Starfield.svelte';
  import Icon from '../lib/Icon.svelte';
  import mark from '../assets/dalto-mark.webp';

  let name = $state('');
  let phone = $state('');
  let pin = $state('');
  let confirm = $state('');
  let remember = $state(true);
  let err = $state('');

  async function submit() {
    if (!name.trim()) { err = 'Ingresa tu nombre.'; return; }
    if (!phone.trim()) { err = 'Ingresa tu teléfono.'; return; }
    if (pin.length < 4) { err = 'El PIN debe tener al menos 4 dígitos.'; return; }
    if (pin !== confirm) { err = 'Los PIN no coinciden.'; return; }
    await store.register(name, phone, pin, remember);
    toast.show('¡Cuenta creada!');
    store.goScreen('menu');
  }
</script>

<div class="welcome">
  <Starfield />
  <div class="nebula" style="opacity:.4"></div>
  <div class="welcome-inner" style="max-width:400px;width:100%">
    <img class="logo-mark" src={mark} alt="DALTO" style="width:76px;margin-bottom:6px" />
    <h2 style="font-family:var(--display);font-size:22px;font-weight:600">Crear cuenta</h2>
    <p class="welcome-sub" style="margin:6px auto 22px">Tus datos se guardan solo en este dispositivo.</p>

    <div style="text-align:left;background:var(--surface);border:1px solid var(--border-strong);border-radius:var(--r-lg);padding:20px">
      <div class="field"><label>Nombre</label><input bind:value={name} placeholder="Tu nombre" /></div>
      <div class="field"><label>Teléfono</label><input bind:value={phone} inputmode="tel" placeholder="Ej. 300 123 4567" /></div>
      <div class="row2">
        <div class="field"><label>PIN (mín. 4 dígitos)</label><input class="pin-input" bind:value={pin} type="password" inputmode="numeric" maxlength="12" /></div>
        <div class="field"><label>Confirmar PIN</label><input class="pin-input" bind:value={confirm} type="password" inputmode="numeric" maxlength="12" /></div>
      </div>
      {#if err}<div class="pin-err">{err}</div>{/if}
      <div class="check-row" class:on={remember} onclick={() => (remember = !remember)} role="checkbox" aria-checked={remember} tabindex="0">
        <div class="check-box"><Icon name="check" size={14} /></div>
        <span class="ct">Recordar mi PIN en este dispositivo</span>
      </div>
      <div class="modal-actions">
        <button class="btn ghost" onclick={() => store.goScreen('welcome')}>Volver</button>
        <button class="btn primary" onclick={submit}>Crear cuenta</button>
      </div>
    </div>
  </div>
</div>
