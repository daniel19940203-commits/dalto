<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import Starfield from './Starfield.svelte';
  import Icon from '../lib/Icon.svelte';
  import mark from '../assets/dalto-mark.webp';

  let busy = $state(false);
  async function resend() {
    busy = true;
    try { await store.resendVerification(); toast.show('Correo reenviado'); }
    catch { toast.show('No se pudo reenviar'); }
    finally { busy = false; }
  }
</script>

<div class="welcome">
  <Starfield />
  <div class="nebula"></div>
  <div class="welcome-inner" style="max-width:400px;width:100%">
    <img class="logo-mark" src={mark} alt="DALTO" style="width:76px" />
    <h2 style="font-family:var(--display);font-size:20px;font-weight:600;margin-top:10px">Verifica tu correo</h2>
    <p class="welcome-sub" style="margin:8px auto 20px">
      Te enviamos un enlace a <b style="color:var(--text)">{store.pendingEmail}</b>.
      Ábrelo para activar tu cuenta y luego inicia sesión.
    </p>
    <div class="callout" style="border-color:var(--teal);text-align:left">
      Revisa también la carpeta de spam o correo no deseado. El enlace puede tardar un par de minutos en llegar.
    </div>
    <button class="btn ghost" style="width:100%;margin-top:14px" onclick={resend} disabled={busy}>{busy ? 'Reenviando…' : 'Reenviar correo'}</button>
    <button class="btn-start" style="width:100%;margin-top:10px" onclick={() => store.goScreen('login')}>Ya verifiqué, iniciar sesión</button>
  </div>
</div>
