<script lang="ts">
  import { store } from '../../lib/store.svelte';
  import Icon from '../../lib/Icon.svelte';
  import EventModal from '../EventModal.svelte';

  const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const YEAR = 2026;
  let month = $state(new Date().getMonth());
  let selected = $state<string | null>(null);
  let showForm = $state(false);

  const first = $derived(new Date(YEAR, month, 1));
  const startDow = $derived(first.getDay());
  const daysInMonth = $derived(new Date(YEAR, month + 1, 0).getDate());
  const prevDim = $derived(new Date(YEAR, month, 0).getDate());
  const todayD = new Date();
  const isCurrentMonth = $derived(month === todayD.getMonth() && YEAR === todayD.getFullYear());

  function ds(d: number) { return `${YEAR}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
  function eventsOn(dateStr: string) { return store.events.filter((e) => e.date === dateStr); }
  const selectedEvents = $derived(selected ? store.events.filter((e) => e.date === selected) : []);
  function nav(delta: number) { month = Math.max(0, Math.min(11, month + delta)); selected = null; }
</script>

<div class="view">
  <div class="view-head"><h2>Calendario</h2><p>Toca un día para ver sus eventos</p></div>
  <div class="seg" style="margin-bottom:16px">
    <button onclick={() => store.go('events')}>Próximos</button>
    <button class="on">Calendario</button>
  </div>

  <div class="cal">
    <div class="cal-head">
      <h3>{first.toLocaleDateString('es-CO', { month: 'long' })} {YEAR}</h3>
      <div class="cal-nav">
        <button class="mini-btn" onclick={() => nav(-1)} aria-label="Mes anterior"><Icon name="left" size={16} /></button>
        <button class="chip-btn" onclick={() => { month = todayD.getMonth(); }}>Hoy</button>
        <button class="mini-btn" onclick={() => nav(1)} aria-label="Mes siguiente"><Icon name="right" size={16} /></button>
      </div>
    </div>
    <div class="cal-grid">
      {#each DOW as d}<div class="dh">{d}</div>{/each}
      {#each Array(startDow) as _, i}<div class="cell out"><span class="dn">{prevDim - startDow + i + 1}</span></div>{/each}
      {#each Array(daysInMonth) as _, i}
        {@const day = i + 1}
        {@const dateStr = ds(day)}
        {@const evs = eventsOn(dateStr)}
        <div class="cell" class:today={isCurrentMonth && day === todayD.getDate()} class:sel={selected === dateStr}
             role="button" tabindex="0" onclick={() => (selected = dateStr)}
             onkeydown={(e) => e.key === 'Enter' && (selected = dateStr)}>
          <span class="dn">{day}</span>
          {#if evs.length}
            <div class="ev-names">
              {#each evs.slice(0, 3) as e}<div class="ev-name" style="background:{e.color}">{e.name}</div>{/each}
              {#if evs.length > 3}<div class="ev-more">+{evs.length - 3} más</div>{/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  {#if selected}
    <div class="card" style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-family:var(--display);font-weight:600">
          {new Date(selected + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <button class="add-fab" onclick={() => (showForm = true)}><Icon name="plus" size={16} /> Evento</button>
      </div>
      {#if selectedEvents.length}
        {#each selectedEvents as e}
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0">
            <span class="evdot" style="background:{e.color}"></span><b>{e.name}</b>
            <span style="color:var(--text-muted);font-size:13px;margin-left:auto">{e.time ?? ''}</span>
          </div>
        {/each}
      {:else}
        <p style="color:var(--text-muted);font-size:14px">Sin eventos este día.</p>
      {/if}
    </div>
  {/if}
</div>

{#if showForm}<EventModal onClose={() => (showForm = false)} />{/if}
