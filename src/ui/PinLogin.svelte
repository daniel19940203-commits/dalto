<script lang="ts">
  import { store } from '../lib/store.svelte';
  import Starfield from './Starfield.svelte';
  import Icon from '../lib/Icon.svelte';
  import mark from '../assets/dalto-mark.webp';

  let pin = $state('');
  let remember = $state(true);
  let err = $state('');

  async function enter() {
    const ok = await store.login(pin, remember);
    if (ok) store.goScreen('menu');
    else { err = 'PIN incorrecto.'; pin = ''; }
  }
</script>

<div class="welcome">
  <Starfield />
  <div class="nebula"></div>
  <div class="welcome-inner" style="max-width:340px;width:100%">
    <img class="logo-mark" src={mark} alt="DALTO" style="width:80px" />
    <h2 style="font-family:var(--display);font-size:20px;font-weight:600;margin-top:10px">Hola, {store.userName}</h2>
    <p class="welcome-sub" style="margin:6px auto 20px">Ingresa tu PIN para continuar</p>
    <input class="pin-input" bind:value={pin} type="password" inputmode="numeric" maxlength="12"
           onkeydown={(e) => e.key === 'Enter' && enter()} autofocus />
    <div class="pin-err">{err}</div>
    <div class="check-row" class:on={remember} onclick={() => (remember = !remember)} role="checkbox" aria-checked={remember} tabindex="0" style="justify-content:center;margin-bottom:10px">
      <div class="check-box"><Icon name="check" size={14} /></div><span class="ct">Recordar mi PIN</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">
      <button class="btn-start" style="width:100%" onclick={enter}>ENTRAR</button>
      <button class="btn ghost" onclick={() => store.goScreen('welcome')}>Volver</button>
    </div>
  </div>
</div>
