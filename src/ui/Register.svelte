<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import { validatePassword, validateEmail } from '../lib/supabase';
  import Starfield from './Starfield.svelte';
  import mark from '../assets/dalto-mark.webp';

  let name = $state('');
  let phone = $state('');
  let email = $state('');
  let password = $state('');
  let confirm = $state('');
  let err = $state('');
  let busy = $state(false);

  async function submit() {
    err = '';
    if (!name.trim()) { err = 'Ingresa tu nombre.'; return; }
    if (!phone.trim()) { err = 'Ingresa tu teléfono.'; return; }
    if (!validateEmail(email)) { err = 'Correo no válido.'; return; }
    const pwErr = validatePassword(password);
    if (pwErr) { err = pwErr; return; }
    if (password !== confirm) { err = 'Las contraseñas no coinciden.'; return; }
    busy = true;
    try {
      await store.register(email, password, name, phone);
    } catch (e: any) {
      err = e?.message?.includes('already') ? 'Ese correo ya está registrado.' : (e?.message ?? 'No se pudo crear la cuenta.');
    } finally { busy = false; }
  }
</script>

<div class="welcome">
  <Starfield />
  <div class="nebula" style="opacity:.4"></div>
  <div class="welcome-inner" style="max-width:420px;width:100%">
    <img class="logo-mark" src={mark} alt="DALTO" style="width:72px;margin-bottom:6px" />
    <h2 style="font-family:var(--display);font-size:22px;font-weight:600">Crear cuenta</h2>
    <p class="welcome-sub" style="margin:6px auto 22px">Tu información, disponible desde cualquier dispositivo.</p>

    <div style="text-align:left;background:var(--surface);border:1px solid var(--border-strong);border-radius:var(--r-lg);padding:20px">
      <div class="row2">
        <div class="field"><label>Nombre</label><input bind:value={name} placeholder="Tu nombre" /></div>
        <div class="field"><label>Teléfono</label><input bind:value={phone} inputmode="tel" placeholder="300 123 4567" /></div>
      </div>
      <div class="field"><label>Correo</label><input bind:value={email} inputmode="email" placeholder="tucorreo@ejemplo.com" /></div>
      <div class="row2">
        <div class="field"><label>Contraseña</label><input type="password" bind:value={password} placeholder="8-20, letras y números" /></div>
        <div class="field"><label>Confirmar</label><input type="password" bind:value={confirm} placeholder="Repite" /></div>
      </div>
      {#if err}<div class="pin-err">{err}</div>{/if}
      <div class="modal-actions">
        <button class="btn ghost" onclick={() => store.goScreen('welcome')} disabled={busy}>Volver</button>
        <button class="btn primary" onclick={submit} disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</button>
      </div>
    </div>
  </div>
</div>
