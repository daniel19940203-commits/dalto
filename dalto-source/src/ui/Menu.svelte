<script lang="ts">
  import { store } from '../lib/store.svelte';
  import Icon from '../lib/Icon.svelte';
  import mark from '../assets/dalto-mark.webp';
  function open(area: 'finances' | 'agenda') {
    store.go(area === 'agenda' ? 'events' : 'overview');
    store.goScreen('shell');
  }
</script>

<div class="menu">
  <div class="nebula"></div>
  <div class="menu-wrap">
    <div class="menu-hi">
      <img src={mark} alt="DALTO" />
      <p class="menu-greet">Hola, {store.userName}</p>
      <p>¿Qué necesitas controlar hoy?</p>
    </div>
    <div class="menu-cards">
      <button class="menu-card" onclick={() => open('finances')}>
        <div class="halo"></div>
        <div class="ic"><Icon name="wallet" size={26} /></div>
        <div><h3>Finanzas</h3><p>Ingresos, deudas, ahorros, provisiones y proyección</p></div>
      </button>
      <button class="menu-card agenda" onclick={() => open('agenda')}>
        <div class="halo"></div>
        <div class="ic"><Icon name="calendar" size={26} /></div>
        <div><h3>Agenda personal</h3><p>Cumpleaños, festivos, eventos y recordatorios</p></div>
      </button>
      <button class="menu-card spend" onclick={() => { store.go('spends'); store.goScreen('shell'); }}>
        <div class="halo"></div>
        <div class="ic"><Icon name="wallet" size={26} /></div>
        <div><h3>Control de gasto</h3><p>Registra cada peso y descuéntalo de tus saldos</p></div>
      </button>
    </div>
  </div>
</div>
