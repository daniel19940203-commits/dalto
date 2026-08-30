<script lang="ts">
  import { store } from '../../lib/store.svelte';
  import { CAT_META, CONCEPT_CATS } from '../../lib/catalog';
  import { formatMoney } from '../../lib/money';
  import { buildColumns, saldos } from '../../domain/finance/summary';
  import type { FinanceOptions } from '../../domain/finance/types';
  import Icon from '../../lib/Icon.svelte';
  import { scrollActive } from '../../lib/scrollActive';

  const money = (n: number) => formatMoney(n, store.currency);
  const nowM = new Date().getMonth();
  const opts = $derived<FinanceOptions>({ autofill: store.autofill, year: 2026, currentMonth: nowM });
  // Consolidado de enero al mes actual
  const cols = $derived(buildColumns([...Array(nowM + 1).keys()], 'monthly'));
  const s = $derived(saldos(store.effectiveConcepts, cols, opts));
  const last = <T,>(a: T[]): T | undefined => a[a.length - 1];

  const rows = $derived([
    { label: 'Disponible', hint: 'Flujo libre del mes actual', val: last(s.disponible) ?? 0, color: 'var(--pos)' },
    { label: 'Acumulado', hint: 'Sobrante consolidado hasta hoy', val: last(s.acumulado) ?? 0, color: 'var(--teal)' },
    { label: 'Ahorro acumulado', hint: 'Provisiones + ahorro total', val: last(s.ahorroAcumulado) ?? 0, color: 'var(--coral)' },
    { label: 'Total saldos', hint: 'Tu patrimonio consolidado', val: last(s.total) ?? 0, color: 'var(--peach)', strong: true },
  ]);
</script>

<div class="view">
  <div class="hub-chips">
    {#each CONCEPT_CATS as k}
      <button class="hub-chip" class:active={k === 'balances'} use:scrollActive={k === 'balances'} onclick={() => store.go(('c_' + k) as any)}>
        <Icon name={CAT_META[k].ic} size={16} /> {CAT_META[k].t}
      </button>
    {/each}
  </div>

  <div class="view-head"><h2>Saldos</h2><p>Bloque calculado — no se agrega nada aquí</p></div>

  <div class="saldos-block">
    {#each rows as r}
      <div class="saldo-row" class:strong={r.strong}>
        <div><div class="sl-label">{r.label}</div><div class="sl-hint">{r.hint}</div></div>
        <div class="sl-val" style="color:{r.color}">{money(r.val)}</div>
      </div>
    {/each}
  </div>
  <p style="font-size:12px;color:var(--text-muted);margin-top:12px;text-align:center">
    <Icon name="lock" size={11} /> Todo aquí se calcula a partir de tus ingresos, salidas y provisiones.
  </p>
</div>
