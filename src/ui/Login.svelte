<script lang="ts">
  import { store } from '../lib/store.svelte';
  import Starfield from './Starfield.svelte';
  import mark from '../assets/dalto-mark.webp';

  let email = $state('');
  let password = $state('');
  let err = $state('');
  let busy = $state(false);

  async function enter() {
    err = '';
    if (!email || !password) { err = 'Ingresa correo y contraseña.'; return; }
    busy = true;
    try {
      await store.login(email, password);
    } catch (e: any) {
      err = /invalid/i.test(e?.message ?? '') ? 'Correo o contraseña incorrectos.' : (e?.message ?? 'No se pudo iniciar sesión.');
    } finally { busy = false; }
  }
</script>

<div class="welcome">
  <Starfield />
  <div class="nebula"></div>
  <div class="welcome-inner" style="max-width:360px;width:100%">
    <img class="logo-mark" src={mark} alt="DALTO" style="width:80px" />
    <h2 style="font-family:var(--display);font-size:20px;font-weight:600;margin-top:10px">Iniciar sesión</h2>
    <p class="welcome-sub" style="margin:6px auto 20px">Entra con tu correo y contraseña</p>

    <div style="text-align:left">
      <div class="field"><label>Correo</label><input bind:value={email} inputmode="email" placeholder="tucorreo@ejemplo.com" /></div>
      <div class="field"><label>Contraseña</label><input type="password" bind:value={password}
        onkeydown={(e) => e.key === 'Enter' && enter()} placeholder="Tu contraseña" /></div>
      {#if err}<div class="pin-err">{err}</div>{/if}
      <button class="btn-start" style="width:100%;margin-top:6px" onclick={enter} disabled={busy}>{busy ? 'Entrando…' : 'ENTRAR'}</button>
      <button class="btn ghost" style="width:100%;margin-top:10px" onclick={() => store.goScreen('forgot')}>¿Olvidaste tu contraseña?</button>
      <button class="btn ghost" style="width:100%;margin-top:8px" onclick={() => store.goScreen('welcome')}>Volver</button>
    </div>
  </div>
</div>
