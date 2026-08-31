<script lang="ts">
  import { store } from '../lib/store.svelte';
  import Starfield from './Starfield.svelte';
  import mark from '../assets/dalto-mark.webp';
  import word from '../assets/dalto-word.webp';
</script>

<div class="welcome">
  <Starfield />
  <div class="nebula"></div>
  <div class="welcome-inner">
    <div class="welcome-eyebrow">Tu dinero · Tu tiempo · Tu destino</div>
    <img class="logo-mark" src={mark} alt="DALTO" />
    <img class="logo-word" src={word} alt="DALTO" />
    <p class="welcome-sub" style="margin-top:18px">Toma el control de tu destino financiero.</p>
    <div style="display:flex;flex-direction:column;gap:12px;max-width:280px;margin:0 auto">
      <button class="btn-start" style="width:100%" onclick={() => store.goScreen('login')}>INICIAR SESIÓN</button>
      <button class="btn-start ghost-start" style="width:100%" onclick={() => store.goScreen('register')}>REGISTRARSE</button>
    </div>
  </div>
</div>
