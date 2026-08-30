<script lang="ts">
  import { store } from '../../lib/store.svelte';
  import { daysUntil } from '../../domain/agenda/types';
  import type { AgendaEvent } from '../../domain/agenda/types';
  import Icon from '../../lib/Icon.svelte';
  import EventModal from '../EventModal.svelte';

  const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const upcoming = $derived(
    store.events.map((e) => ({ ...e, dl: daysUntil(e.date) }))
      .filter((e) => e.dl >= 0).sort((a, b) => a.dl - b.dl),
  );
  let editing = $state<AgendaEvent | null>(null);
  let showForm = $state(false);
  function add() { editing = null; showForm = true; }
  function edit(e: AgendaEvent) { editing = e; showForm = true; }
</script>

<div class="view">
  <div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 16px">
    <div class="view-head" style="margin:0"><h2>Próximos eventos</h2><p>{upcoming.length} en tu horizonte</p></div>
    <button class="add-fab" onclick={add}><Icon name="plus" size={18} /> Evento</button>
  </div>

  <div class="seg" style="margin-bottom:16px">
    <button class="on">Próximos</button>
    <button onclick={() => store.go('calendar')}>Calendario</button>
  </div>

  {#if upcoming.length}
    {#each upcoming as e (e.id)}
      {@const d = new Date(e.date + 'T00:00:00')}
      <button class="day-card" style="width:100%;text-align:left" onclick={() => edit(e)}>
        <div class="date"><div class="dow">{DOW[d.getDay()]}</div><div class="num">{d.getDate()}</div></div>
        <div class="info"><div class="t"><span class="evdot" style="background:{e.color}"></span>{e.name}</div>
          <div class="m">{e.category}{e.time ? ' · ' + e.time : ''}{e.reminder ? ' · 🔔' : ''}</div></div>
        <div class="left"><div class="n">{e.dl === 0 ? 'Hoy' : e.dl}</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">{e.dl === 0 ? '' : e.dl === 1 ? 'día' : 'días'}</div></div>
      </button>
    {/each}
  {:else}
    <div class="empty"><Icon name="calendar" size={42} /><b>No hay eventos próximos.</b><span>Agrega uno para no olvidarlo.</span></div>
  {/if}

  <div class="callout" style="margin-top:16px;border-color:var(--teal)">
    🔔 Los recordatorios se muestran al abrir la app. En esta versión local no hay notificaciones push (se activarán si algún día movemos DALTO a la nube).
  </div>
</div>

{#if showForm}<EventModal event={editing} onClose={() => (showForm = false)} />{/if}
