<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import { validateEmail } from '../lib/supabase';
  import Starfield from './Starfield.svelte';
  import mark from '../assets/dalto-mark.webp';

  let email = $state('');
  let sent = $state(false);
  let err = $state('');
  let busy = $state(false);

  async function submit() {
    err = '';
    if (!validateEmail(email)) { err = 'Correo no válido.'; return; }
    busy = true;
    try { await store.requestPasswordReset(email); sent = true; }
    catch (e: any) { err = e?.message ?? 'No se pudo enviar.'; }
    finally { busy = false; }
  }
</script>

<div class="welcome">
  <Starfield />
  <div class="nebula"></div>
  <div class="welcome-inner" style="max-width:360px;width:100%">
    <img class="logo-mark" src={mark} alt="DALTO" style="width:76px" />
    <h2 style="font-family:var(--display);font-size:20px;font-weight:600;margin-top:10px">Recuperar contraseña</h2>
    {#if sent}
      <p class="welcome-sub" style="margin:10px auto 20px">Si el correo existe, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja (y spam).</p>
      <button class="btn-start" style="width:100%" onclick={() => store.goScreen('login')}>Volver a iniciar sesión</button>
    {:else}
      <p class="welcome-sub" style="margin:8px auto 18px">Ingresa tu correo y te enviaremos un enlace.</p>
      <div style="text-align:left">
        <div class="field"><label>Correo</label><input bind:value={email} inputmode="email" placeholder="tucorreo@ejemplo.com" /></div>
        {#if err}<div class="pin-err">{err}</div>{/if}
        <button class="btn-start" style="width:100%;margin-top:6px" onclick={submit} disabled={busy}>{busy ? 'Enviando…' : 'Enviar enlace'}</button>
        <button class="btn ghost" style="width:100%;margin-top:10px" onclick={() => store.goScreen('login')}>Volver</button>
      </div>
    {/if}
  </div>
</div>
