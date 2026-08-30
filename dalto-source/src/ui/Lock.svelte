<script lang="ts">
  import { store } from '../lib/store.svelte';
  import Starfield from './Starfield.svelte';
  import mark from '../assets/dalto-mark.webp';

  let pin = $state('');
  let err = $state('');

  async function tryUnlock() {
    const ok = await store.unlock(pin);
    if (!ok) { err = 'PIN incorrecto.'; pin = ''; }
  }
</script>

<div class="lock-screen">
  <Starfield />
  <div class="nebula"></div>
  <div class="lock-inner">
    <img src={mark} alt="DALTO" />
    <h2>DALTO está bloqueado</h2>
    <p>Ingresa tu PIN para descifrar tus datos</p>
    <input class="pin-input" bind:value={pin} inputmode="numeric" type="password" maxlength="12"
           onkeydown={(e) => e.key === 'Enter' && tryUnlock()} autofocus />
    <div class="pin-err">{err}</div>
    <button class="btn-start" style="width:100%" onclick={tryUnlock}>DESBLOQUEAR</button>
  </div>
</div>
