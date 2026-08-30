<script lang="ts">
  import { store } from '../../lib/store.svelte';
  import { formatMoney } from '../../lib/money';
  import { SPEND_COLORS, spendTotalForMonth } from '../../domain/finance/spend';
  import type { Spend } from '../../domain/finance/spend';
  import Icon from '../../lib/Icon.svelte';
  import SpendModal from '../SpendModal.svelte';

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const money = (n: number) => formatMoney(n, store.currency);
  const nowM = new Date().getMonth();

  let filterMonth = $state(nowM);
  let editing = $state<Spend | null>(null);
  let showForm = $state(false);

  const monthSpends = $derived(
    store.spends.filter((s) => s.month === filterMonth)
      .sort((a, b) => b.date.localeCompare(a.date)),
  );
  const monthTotal = $derived(spendTotalForMonth(store.spends, filterMonth));

  function add() { editing = null; showForm = true; }
  function edit(s: Spend) { editing = s; showForm = true; }
  function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }
</script>

<div class="view">
  <div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 16px">
    <div class="view-head" style="margin:0"><h2>Control de gasto</h2><p>Registra cada peso que gastas</p></div>
    <button class="add-fab" onclick={add}><Icon name="plus" size={18} /> Control de gasto</button>
  </div>

  <div class="mchips" style="margin-bottom:14px">
    {#each MONTHS as m, i}
      <button class="mchip" class:on={filterMonth === i} onclick={() => (filterMonth = i)}>{m.slice(0, 3)}</button>
    {/each}
  </div>

  <div class="section-total" style="margin-bottom:16px">
    <div class="lab">Gasto real de {MONTHS[filterMonth]}<span class="lock"><Icon name="lock" size={11} /> descuenta en Entretenimiento</span></div>
    <div class="amt" style="color:var(--neg)">{money(-monthTotal)}</div>
  </div>

  {#if monthSpends.length}
    {#each monthSpends as s (s.id)}
      <button class="concept" style="width:100%;text-align:left" onclick={() => edit(s)}>
        <div class="cic" style="background:{SPEND_COLORS[s.category]}22;color:{SPEND_COLORS[s.category]}"><Icon name="wallet" size={18} /></div>
        <div class="cmain">
          <div class="cname">{s.note || s.category}</div>
          <div class="cmeta"><span class="badge" style="background:{SPEND_COLORS[s.category]}22;color:{SPEND_COLORS[s.category]}">{s.category}</span> · {fmtDate(s.date)}</div>
        </div>
        <div class="camt" style="color:var(--neg)">{money(s.amount)}</div>
      </button>
    {/each}
  {:else}
    <div class="empty"><Icon name="wallet" size={42} /><b>Sin gastos en {MONTHS[filterMonth]}.</b><span>Toca "Control de gasto" para registrar el primero.</span></div>
  {/if}
</div>

{#if showForm}<SpendModal spend={editing} onClose={() => (showForm = false)} />{/if}
