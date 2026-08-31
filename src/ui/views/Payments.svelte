<script lang="ts">
  import { store } from '../../lib/store.svelte';
  import { formatMoney } from '../../lib/money';
  import { CAT_META, CONCEPT_CATS } from '../../lib/catalog';
  import { payablesForMonth, paySummary, entertainmentTotal } from '../../domain/finance/payments';
  import type { PayStatus } from '../../domain/finance/payments';
  import type { FinanceOptions } from '../../domain/finance/types';
  import Icon from '../../lib/Icon.svelte';
  import { scrollActive } from '../../lib/scrollActive';

  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const money = (n: number) => formatMoney(n, store.currency);
  const nowM = new Date().getMonth();

  let month = $state(nowM);
  const opts = $derived<FinanceOptions>({ autofill: store.autofill, year: 2026, currentMonth: nowM });
  const items = $derived(payablesForMonth(store.effectiveConcepts, store.payLedger, month, opts));
  const sum = $derived(paySummary(store.effectiveConcepts, store.payLedger, month, opts));
  const entTotal = $derived(entertainmentTotal(store.effectiveConcepts, month, opts));

  function setStatus(id: string, status: PayStatus) {
    store.setPayStatus(id, 2026, month, status);
  }
</script>

<div class="view">
  <div class="view-head"><h2>Control de pagos</h2><p>Marca qué ya pagaste y qué falta, mes a mes</p></div>

  <div class="mchips" style="margin-bottom:14px">
    {#each MONTHS as m, i}
      <button class="mchip" class:on={month === i} use:scrollActive={month === i} onclick={() => (month = i)}>{m}</button>
    {/each}
  </div>

  <div class="ent-box">
    <div>
      <div class="ent-lab"><Icon name="sparkles" size={15} /> Gastos entretenimiento</div>
    </div>
    <div class="ent-amt">{money(entTotal)}</div>
  </div>

  <div class="pay-summary">
    <div class="pay-block"><span>Ingreso del mes</span><b style="color:var(--pos)">{money(sum.income)}</b></div>
    <div class="pay-block"><span>Total pagado</span><b style="color:var(--teal)">{money(sum.paid)}</b></div>
    <div class="pay-block"><span>Saldo</span><b style="color:{sum.balance < 0 ? 'var(--neg)' : 'var(--text)'}">{money(sum.balance)}</b></div>
    <div class="pay-block"><span>Pendiente</span><b style="color:var(--neg)">{money(sum.pending)}</b></div>
    <div class="pay-block"><span>Aplazado</span><b style="color:var(--warn)">{money(sum.deferred)}</b></div>
  </div>

  {#if items.length}
    <div style="margin-top:16px">
      {#each items as it (it.concept.id)}
        <div class="pay-row">
          <div class="pay-main">
            <div class="pay-name">{it.concept.name}</div>
            <div class="pay-meta">{CAT_META[it.concept.category].t} · {money(it.amount)}</div>
          </div>
          <div class="pay-btns">
            <button class="pb paid" class:on={it.status === 'paid'} onclick={() => setStatus(it.concept.id, 'paid')}>Pagado</button>
            <button class="pb pend" class:on={it.status === 'pending'} onclick={() => setStatus(it.concept.id, 'pending')}>Pendiente</button>
            <button class="pb defer" class:on={it.status === 'deferred'} onclick={() => setStatus(it.concept.id, 'deferred')}>Aplazado</button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty"><Icon name="check" size={42} /><b>No hay conceptos por pagar en {MONTHS[month]}.</b><span>Agrega conceptos en Finanzas para verlos aquí.</span></div>
  {/if}
</div>
