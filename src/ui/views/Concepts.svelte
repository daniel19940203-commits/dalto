<script lang="ts">
  import type { Category, Concept } from '../../domain/finance/types';
  import { store } from '../../lib/store.svelte';
  import { CAT_META, CONCEPT_CATS } from '../../lib/catalog';
  import { formatMoney } from '../../lib/money';
  import { byCategory } from '../../domain/finance';
  import { debtInfo } from '../../domain/finance/debt';
  import { spendTotalForMonth } from '../../domain/finance/spend';
  import { SUBCATS } from '../../domain/finance/summary';
  import { freqLabel } from '../../lib/format';
  import Icon from '../../lib/Icon.svelte';
  import { scrollActive } from '../../lib/scrollActive';
  import ConceptModal from '../ConceptModal.svelte';
  import DeleteModal from '../DeleteModal.svelte';

  const cat = $derived(store.view.slice(2) as Category);
  const meta = $derived(CAT_META[cat]);
  const items = $derived(byCategory(store.concepts, cat));
  const total = $derived(items.reduce((s, x) => s + x.amount, 0));
  const positive = $derived(cat === 'income' || cat === 'balances');
  const money = (n: number) => formatMoney(n, store.currency);

  // Agrupar por tipo (subcategoría), en el orden de SUBCATS, solo los que tienen ítems.
  const groups = $derived(
    SUBCATS[cat]
      .map((sub) => ({ sub, list: items.filter((x) => x.type === sub) }))
      .filter((g) => g.list.length > 0),
  );

  let editing = $state<Concept | null>(null);
  let showForm = $state(false);
  let deleting = $state<Concept | null>(null);
  function add() { editing = null; showForm = true; }
  function edit(c: Concept) { editing = c; showForm = true; }

  function meta_line(x: Concept): string {
    if (x.recurring === false && (x.installments ?? 0) > 0)
      return `${x.installments} cuota${x.installments === 1 ? '' : 's'} de ${money(x.amount)}`;
    if (x.kind === 'income') return `${freqLabel(x.frequency)}`;
    if (x.kind === 'balance') return `Saldo actual`;
    return x.recurring === false ? 'Con fecha de fin' : 'Sin caducidad';
  }
  const totalLabel = $derived(
    cat === 'income' ? 'Total ingresos' : cat === 'balances' ? 'Total saldos' : `Total ${meta.t.toLowerCase()}`,
  );
</script>

<div class="view">
  <div class="hub-chips">
    {#each CONCEPT_CATS as k}
      <button class="hub-chip" class:active={k === cat} use:scrollActive={k === cat} onclick={() => store.go(('c_' + k) as any)}>
        <Icon name={CAT_META[k].ic} size={16} /> {CAT_META[k].t}
      </button>
    {/each}
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 16px">
    <div class="view-head" style="margin:0"><h2>{meta.t}</h2><p>{items.length} {items.length === 1 ? 'concepto' : 'conceptos'}</p></div>
    <button class="add-fab" onclick={add}><Icon name="plus" size={18} /> Nuevo</button>
  </div>

  {#if items.length}
    {#each groups as g}
      <div class="type-title">{g.sub}<span class="type-count">{g.list.length}</span></div>
      {#each g.list as x (x.id)}
        {@const info = x.recurring === false ? debtInfo(x) : null}
        <div class="concept">
          <div class="cic"><Icon name={CAT_META[cat].ic} size={19} /></div>
          <div class="cmain">
            <div class="cname">{x.name}</div>
            <div class="cmeta">{meta_line(x)}</div>
            {#if info}
              <div class="debt-tags">
                <span class="dtag">Capital {money(info.principal)}</span>
                <span class="dtag warn">Interés {info.interestPct.toFixed(1)}%</span>
                <span class="dtag warn">E.A. {(info.annualRate * 100).toFixed(1)}%</span>
              </div>
            {/if}
          </div>
          <div class="camt" style="color:{positive ? 'var(--pos)' : 'var(--text)'}">{money(x.amount)}</div>
          <div class="cactions">
            <button class="mini-btn" onclick={() => edit(x)} aria-label="Editar"><Icon name="edit" size={16} /></button>
            <button class="mini-btn danger" onclick={() => (deleting = x)} aria-label="Eliminar"><Icon name="trash" size={16} /></button>
          </div>
        </div>
      {/each}
    {/each}
    <div class="section-total">
      <div class="lab">{totalLabel}<span class="lock"><Icon name="lock" size={11} /> calculado</span></div>
      <div class="amt" style="color:{positive ? 'var(--pos)' : 'var(--neg)'}">{money(positive ? total : -total)}</div>
    </div>
    {#if cat === 'entertainment'}
      {@const spendMonth = spendTotalForMonth(store.spends, new Date().getMonth())}
      <div class="type-title" style="margin-top:22px">Control de gasto</div>
      <div class="concept" style="border-color:var(--border-strong)">
        <div class="cic"><Icon name="wallet" size={19} /></div>
        <div class="cmain">
          <div class="cname">Gasto real del mes <span class="badge neutral">solo lectura</span></div>
          <div class="cmeta">Se suma a lo presupuestado y descuenta de tus saldos</div>
        </div>
        <div class="camt" style="color:var(--neg)">{money(spendMonth)}</div>
      </div>
      <button class="btn ghost" style="margin-top:10px;padding:12px" onclick={() => store.go('spends')}>
        <Icon name="wallet" size={16} /> Ir a Control de gasto
      </button>
    {/if}
  {:else}
    <div class="empty"><Icon name="wallet" size={42} /><b>Aún no agregas información aquí.</b><span>Toca "Nuevo" para empezar.</span></div>
  {/if}
</div>

{#if showForm}<ConceptModal {cat} concept={editing} onClose={() => (showForm = false)} />{/if}
{#if deleting}<DeleteModal concept={deleting} onClose={() => (deleting = null)} />{/if}
