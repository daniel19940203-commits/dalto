<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './lib/store.svelte';
  import Welcome from './ui/Welcome.svelte';
  import Register from './ui/Register.svelte';
  import PinLogin from './ui/PinLogin.svelte';
  import Menu from './ui/Menu.svelte';
  import Shell from './ui/Shell.svelte';
  import Lock from './ui/Lock.svelte';
  import Toast from './ui/Toast.svelte';

  onMount(() => { store.init(); });
</script>

{#if !store.ready}
  <div style="position:absolute;inset:0;display:grid;place-items:center;background:#0e0c1e;color:#8b83a3"><p>Cargando…</p></div>
{:else if store.locked}
  <Lock />
{:else if !store.loggedIn && store.screen === 'register'}
  <Register />
{:else if !store.loggedIn && store.screen === 'pin'}
  <PinLogin />
{:else if !store.loggedIn}
  <Welcome />
{:else if store.screen === 'menu'}
  <Menu />
{:else}
  <Shell />
{/if}

<Toast />
