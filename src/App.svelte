<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './lib/store.svelte';
  import Welcome from './ui/Welcome.svelte';
  import Register from './ui/Register.svelte';
  import Login from './ui/Login.svelte';
  import Verify from './ui/Verify.svelte';
  import Forgot from './ui/Forgot.svelte';
  import Menu from './ui/Menu.svelte';
  import Shell from './ui/Shell.svelte';
  import Toast from './ui/Toast.svelte';

  onMount(() => { store.init(); });
</script>

{#if !store.ready}
  <div style="position:absolute;inset:0;display:grid;place-items:center;background:#0e0c1e;color:#8b83a3"><p>Cargando…</p></div>
{:else if store.loggedIn}
  {#if store.screen === 'menu'}<Menu />{:else}<Shell />{/if}
{:else if store.screen === 'register'}
  <Register />
{:else if store.screen === 'login'}
  <Login />
{:else if store.screen === 'verify'}
  <Verify />
{:else if store.screen === 'forgot'}
  <Forgot />
{:else}
  <Welcome />
{/if}

<Toast />
