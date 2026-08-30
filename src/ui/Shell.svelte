<script lang="ts">
  import { store } from '../lib/store.svelte';
  import Icon from '../lib/Icon.svelte';
  import mark from '../assets/dalto-mark.webp';
  import Overview from './views/Overview.svelte';
  import Concepts from './views/Concepts.svelte';
  import Saldos from './views/Saldos.svelte';
  import Spends from './views/Spends.svelte';
  import Payments from './views/Payments.svelte';
  import Summary from './views/Summary.svelte';
  import Advisor from './views/Advisor.svelte';
  import Events from './views/Events.svelte';
  import Calendar from './views/Calendar.svelte';
  import Settings from './views/Settings.svelte';
  import Placeholder from './views/Placeholder.svelte';

  const TITLES: Record<string, string> = {
    overview: 'General', summary: 'Resumen específico', advisor: 'Asesor financiero',
    events: 'Próximos eventos', calendar: 'Calendario', settings: 'Ajustes', spends: 'Control de gasto', payments: 'Control de pagos',
    c_income: 'Ingresos', c_fixed: 'Gastos fijos', c_memberships: 'Membresías',
    c_unexpected: 'Imprevistos', c_provisions: 'Provisiones', c_entertainment: 'Entretenimiento', c_balances: 'Saldos',
  };

  const finNav = [
    ['overview', 'wallet', 'General'], ['summary', 'scale', 'Resumen'], ['payments', 'check', 'Pagos'],
    ['c_income', 'trending-up', 'Ingresos'], ['c_fixed', 'trending-down', 'Gastos fijos'],
    ['c_memberships', 'credit-card', 'Membresías'], ['c_unexpected', 'alert', 'Imprevistos'],
    ['c_provisions', 'shield', 'Provisiones'], ['c_entertainment', 'sparkles', 'Entretenimiento'],
    ['c_balances', 'scale', 'Saldos'], ['advisor', 'compass', 'Asesor'],
  ] as const;
  const agNav = [['events', 'calendar', 'Próximos'], ['calendar', 'calendar', 'Calendario']] as const;
  const bottom = [
    ['overview', 'home', 'Inicio'], ['summary', 'scale', 'Resumen'], ['payments', 'check', 'Pagos'],
    ['c_income', 'wallet', 'Conceptos'], ['advisor', 'compass', 'Asesor'], ['events', 'calendar', 'Agenda'],
    ['spends', 'wallet', 'Gastos'],
  ] as const;

  const bnActive = $derived(
    store.view.startsWith('c_') ? 'c_income'
    : ['overview', 'summary', 'advisor', 'events', 'spends'].includes(store.view) ? store.view
    : store.view === 'calendar' ? 'events' : '',
  );

  function cycleCurrency() { store.setCurrency(store.currency === 'COP' ? 'USD' : 'COP'); }
</script>

<div class="shell">
  <aside class="sidebar">
    <div class="brand"><img src={mark} alt="" /><div><b>DALTO</b><small>CONTROL</small></div></div>
    <div class="nav-group">
      <div class="nav-label">Finanzas</div>
      {#each finNav as [v, ic, label]}
        <button class="nav-item" class:active={store.view === v} onclick={() => store.go(v)}>
          <Icon name={ic} /> {label}
        </button>
      {/each}
    </div>
    <div class="nav-group">
      <div class="nav-label">Agenda</div>
      {#each agNav as [v, ic, label]}
        <button class="nav-item" class:active={store.view === v} onclick={() => store.go(v)}>
          <Icon name={ic} /> {label}
        </button>
      {/each}
    </div>
    <div class="nav-group">
      <div class="nav-label">Control de gasto</div>
      <button class="nav-item" class:active={store.view === 'spends'} onclick={() => store.go('spends')}>
        <Icon name="wallet" /> Registrar gasto
      </button>
    </div>
    <div class="sidebar-foot nav-group">
      <button class="nav-item" class:active={store.view === 'settings'} onclick={() => store.go('settings')}>
        <Icon name="settings" /> Ajustes
      </button>
      <button class="nav-item" onclick={() => store.goScreen('menu')}>
        <Icon name="home" /> Menú principal
      </button>
    </div>
  </aside>

  <div class="main-col">
    <header class="topbar">
      <div class="m-brand"><img src={mark} alt="" /><b>DALTO</b></div>
      <h1>{TITLES[store.view]}</h1>
      <div class="sp"></div>
      <button class="chip-btn" onclick={cycleCurrency} aria-label="Cambiar moneda">{store.currency}</button>
      <button class="icon-btn" onclick={() => store.go('settings')} aria-label="Ajustes"><Icon name="settings" /></button>
    </header>

    <main class="content">
      {#if store.view === 'overview'}
        <Overview />
      {:else if store.view === 'summary'}
        <Summary />
      {:else if store.view === 'c_balances'}
        <Saldos />
      {:else if store.view.startsWith('c_')}
        <Concepts />
      {:else if store.view === 'advisor'}
        <Advisor />
      {:else if store.view === 'events'}
        <Events />
      {:else if store.view === 'calendar'}
        <Calendar />
      {:else if store.view === 'settings'}
        <Settings />
      {:else if store.view === 'spends'}
        <Spends />
      {:else if store.view === 'payments'}
        <Payments />
      {:else}
        <Placeholder title={TITLES[store.view]} />
      {/if}
    </main>
  </div>

  <nav class="bottomnav">
    {#each bottom as [v, ic, label]}
      <button class="bn-item" class:active={bnActive === v} onclick={() => store.go(v)}>
        <Icon name={ic} size={22} /> {label}
      </button>
    {/each}
  </nav>
</div>
