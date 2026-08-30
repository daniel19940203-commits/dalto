<script lang="ts">
  import { store } from '../../lib/store.svelte';
  import { formatMoney } from '../../lib/money';
  import Icon from '../../lib/Icon.svelte';
  import type { FinanceOptions } from '../../domain/finance/types';
  import {
    BLOCKS, SUBCATS, buildColumns, categoryTotal, subcategoryTotal, saldos,
  } from '../../domain/finance/summary';

  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const nowM = new Date().getMonth();
  const money = (n: number) => formatMoney(n, store.currency);

  let months = $state<number[]>([...Array(12).keys()]);
  let onlyTotals = $state(false);
  let collapsed = $state<Record<string, boolean>>({});

  const opts = $derived<FinanceOptions>({ autofill: store.autofill, year: 2026, currentMonth: nowM });
  const cols = $derived(buildColumns(months, store.period));
  const concepts = $derived(store.effectiveConcepts);
  const sal = $derived(saldos(concepts, cols, opts));
  const allMonths = $derived(months.length === 12);

  function toggleMonth(i: number) {
    months = months.includes(i) ? months.filter((m) => m !== i) : [...months, i];
  }
  function toggleAll() {
    months = allMonths ? [nowM] : [...Array(12).keys()];
  }
  function toggleBlock(key: string) {
    collapsed = { ...collapsed, [key]: !collapsed[key] };
  }
  const isCollapsed = (key: string) => collapsed[key] || onlyTotals;

  const saldoRows = $derived([
    { label: 'Disponible', arr: sal.disponible, strong: false, disp: true },
    { label: 'Acumulado', arr: sal.acumulado, strong: true, disp: false },
    { label: 'Ahorro acumulado', arr: sal.ahorroAcumulado, strong: true, disp: false },
    { label: 'Total saldos', arr: sal.total, strong: true, disp: false },
  ]);
</script>

<div class="view">
  <div class="view-head"><h2>Resumen específico</h2><p>Ingresos · Salidas · Ahorro · Saldos consolidados</p></div>

  <div class="sum-tools">
    <div class="sum-row">
      <div class="seg">
        <button class:on={store.period === 'monthly'} onclick={() => store.setPeriod('monthly')}>Mensual</button>
        <button class:on={store.period === 'semiMonthly'} onclick={() => store.setPeriod('semiMonthly')}>Quincenal</button>
      </div>
      <div class="seg">
        <button class:on={onlyTotals} onclick={() => (onlyTotals = !onlyTotals)}><Icon name="rows" size={15} /> Solo totales</button>
      </div>
    </div>
    <div class="sum-row" style="justify-content:space-between">
      <div class="legend">
        <span><i style="background:var(--teal)"></i>Ingresos</span>
        <span><i style="background:var(--neg)"></i>Salidas</span>
        <span><i style="background:var(--coral)"></i>Ahorro</span>
        <span><i style="background:var(--peach)"></i>Saldos</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;font-size:12px;color:var(--text-muted)">
        <span class="badge actual">real</span><span class="badge auto">proyectado</span>
      </div>
    </div>
    <div class="mchips">
      <button class="mchip allbtn" onclick={toggleAll}>{allMonths ? 'Ninguno' : 'Todos'}</button>
      {#each MONTHS as m, i}
        <button class="mchip" class:on={months.includes(i)} onclick={() => toggleMonth(i)}>{m}</button>
      {/each}
    </div>
  </div>

  {#if cols.length}
    <div class="table-wrap">
      <table class="fin">
        <thead>
          <tr><th>Concepto</th>{#each cols as c}<th>{c.label}</th>{/each}</tr>
        </thead>
        <tbody>
          {#each BLOCKS as block}
            <tr class="sep-row"><td colspan={cols.length + 1}></td></tr>

            {#if block.saldos}
              <tr class="macro sdo"><td>Saldos</td>{#each sal.total as v, i}<td class:cell-auto={cols[i].month > nowM}>{money(v)}</td>{/each}</tr>
              {#each saldoRows as row}
                <tr class="sdo-row" class:strong={row.strong}>
                  <td>{row.label}</td>
                  {#each row.arr as v, i}
                    <td class:cell-auto={cols[i].month > nowM}
                        style="color:{row.disp ? (v < 0 ? 'var(--neg)' : 'var(--pos)') : 'var(--teal)'}">{money(v)}</td>
                  {/each}
                </tr>
              {/each}
            {:else}
              {@const cat = block.category!}
              {@const blkTotals = cols.map((col) => categoryTotal(concepts, cat, col, opts))}
              {@const collapsedBlk = isCollapsed(block.key)}
              <tr class="macro {block.macro}" onclick={() => toggleBlock(block.key)}>
                <td><span class="chev" class:open={!collapsedBlk}><Icon name="chev" size={14} /></span>{block.label}</td>
                {#each blkTotals as v, i}<td class:cell-auto={cols[i].month > nowM}>{money(block.sign * v)}</td>{/each}
              </tr>
              {#if !collapsedBlk}
                {#each SUBCATS[cat] as sub}
                  {@const arr = cols.map((col) => subcategoryTotal(concepts, cat, sub, col, opts))}
                  {@const has = concepts.some((c) => c.category === cat && c.type === sub)}
                  <tr class="concept-r">
                    <td>{sub}</td>
                    {#each arr as v, i}
                      <td class:cell-auto={cols[i].month > nowM}
                          style="color:{block.sign > 0 ? 'var(--pos)' : 'var(--neg)'}">{has && v ? money(block.sign * v) : '—'}</td>
                    {/each}
                  </tr>
                {/each}
              {/if}
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
    <p style="font-size:12px;color:var(--text-muted);margin-top:12px">
      Toca el título de un bloque para contraer sus subcategorías; el total queda sobre el título. En Saldos, el disponible y el ahorro se consolidan mes a mes.
    </p>
  {:else}
    <div class="empty"><Icon name="calendar" size={42} /><b>Selecciona al menos un mes</b></div>
  {/if}
</div>
