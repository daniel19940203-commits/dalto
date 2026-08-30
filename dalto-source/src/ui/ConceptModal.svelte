<script lang="ts">
  import type { Concept, Category } from '../domain/finance/types';
  import { SUBCATS } from '../domain/finance/summary';
  import { CAT_META } from '../lib/catalog';
  import { store } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import { formatMoney } from '../lib/money';
  import { debtInfo } from '../domain/finance/debt';
  import Icon from '../lib/Icon.svelte';

  let { cat, concept = null, onClose }:
    { cat: Category; concept?: Concept | null; onClose: () => void } = $props();

  const meta = CAT_META[cat];
  const nowM = new Date().getMonth();
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // Variantes del formulario por categoría
  const isProvision = cat === 'provisions';
  const isUnexpected = cat === 'unexpected';
  const canRecur = !isProvision && !isUnexpected; // muestra toggle "cargo fijo"
  const isDebtCat = cat === 'fixed' || cat === 'memberships'; // capital + interés
  const showFreq = !isUnexpected;

  const amountLabel = cat === 'income' ? 'Monto'
    : isProvision ? 'Ahorro mensual'
    : isUnexpected ? 'Monto del imprevisto'
    : 'Costo / cuota mensual';

  let name = $state(concept?.name ?? '');
  let type = $state(concept?.type ?? SUBCATS[cat][0]);
  let frequency = $state<'monthly' | 'semiMonthly'>(concept?.frequency ?? 'monthly');
  let amount = $state(concept ? String(concept.amount) : '');
  let startMonth = $state(concept?.startMonth ?? nowM);
  let recurring = $state(concept ? !(concept.installments && concept.installments > 0) : true);
  let installments = $state(concept?.installments ? String(concept.installments) : '1');
  let totalInstallments = $state(concept?.totalInstallments ? String(concept.totalInstallments) : '');
  let principal = $state(concept?.principal ? String(concept.principal) : '');
  let savingsTotal = $state(concept?.savingsTotal ? String(concept.savingsTotal) : '');
  let monthlyIncrease = $state(concept?.monthlyIncrease ? String(concept.monthlyIncrease) : '');
  let description = $state(concept?.description ?? '');

  const totalDebt = $derived(() => {
    const p = Number(amount) || 0, n = Number(installments) || 0;
    return !recurring && n ? formatMoney(p * n, store.currency) : '—';
  });
  const interest = $derived(() => {
    const cap = Number(principal) || 0;
    const term = Number(totalInstallments) || Number(installments) || 0;
    const pay = Number(amount) || 0;
    if (!isDebtCat || recurring || cap <= 0 || term <= 0 || pay <= 0) return null;
    return debtInfo({ id: 'x', name: '', category: cat, type, kind: 'installment', frequency: 'monthly',
      amount: pay, installments: term, totalInstallments: term, principal: cap });
  });

  async function save() {
    const amt = Number(amount) || 0;
    if (!name.trim() || !amt) { toast.show('Completa nombre y monto'); return; }

    let dur = 0;
    let rec: boolean | undefined = true;
    if (isUnexpected) { dur = 1; rec = false; }          // imprevisto = un solo mes
    else if (isProvision) { dur = 0; rec = true; }        // provisión = recurrente
    else if (canRecur && !recurring) { dur = Math.max(1, Number(installments) || 1); rec = false; }

    const obj: Concept = {
      id: concept?.id ?? store.newId(),
      name: name.trim(),
      category: cat,
      type,
      kind: dur > 0 && isDebtCat ? 'installment' : meta.kind,
      frequency,
      amount: amt,
      recurring: rec,
      startMonth,
      description: description.trim() || undefined,
      ...(dur > 0 ? { installments: dur } : {}),
      ...(isDebtCat && !recurring && Number(principal) ? { principal: Number(principal) } : {}),
      ...(isDebtCat && !recurring && Number(totalInstallments) ? { totalInstallments: Number(totalInstallments) } : {}),
      ...(isProvision && Number(savingsTotal) ? { savingsTotal: Number(savingsTotal) } : {}),
      ...(Number(monthlyIncrease) ? { monthlyIncrease: Number(monthlyIncrease) } : {}),
    };
    await store.saveConcept(obj);
    toast.show(concept ? 'Concepto actualizado' : 'Concepto creado');
    onClose();
  }
</script>

<div class="modal-back" onclick={(e) => e.target === e.currentTarget && onClose()} role="presentation">
  <div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <div><h3>{concept ? 'Editar concepto' : 'Nuevo concepto'}</h3><p class="msub">{meta.t}</p></div>
      <button class="mini-btn" onclick={onClose} aria-label="Cerrar"><Icon name="x" size={16} /></button>
    </div>

    <div class="field"><label>Nombre del concepto *</label>
      <input bind:value={name} placeholder="Ej. Arriendo" /></div>

    <div class="row2">
      <div class="field"><label>Tipo *</label>
        <select bind:value={type}>{#each SUBCATS[cat] as t}<option value={t}>{t}</option>{/each}</select>
      </div>
      <div class="field"><label>{amountLabel} *</label>
        <input bind:value={amount} inputmode="numeric" placeholder="0" /></div>
    </div>

    <div class="row2">
      <div class="field"><label>Aplica desde</label>
        <select bind:value={startMonth}>{#each MONTHS as m, i}<option value={i}>{m}</option>{/each}</select>
      </div>
      {#if showFreq}
        <div class="field"><label>Frecuencia</label>
          <select bind:value={frequency}>
            <option value="monthly">Mensual</option>
            <option value="semiMonthly">Quincenal</option>
          </select>
        </div>
      {/if}
    </div>

    {#if isProvision}
      <div class="field"><label>Ahorro total (opcional)</label>
        <input bind:value={savingsTotal} inputmode="numeric" placeholder="Suma directa al ahorro acumulado" /></div>
      <div class="callout" style="border-color:var(--teal)">El <b>Ahorro total</b> se suma a tu ahorro acumulado sin descontarse de ningún otro concepto.</div>
    {/if}

    {#if isUnexpected}
      <div class="callout">Un imprevisto aplica <b>solo al mes seleccionado</b>.</div>
    {/if}

    {#if canRecur}
      <button class="toggle" class:on={recurring} onclick={() => (recurring = !recurring)} type="button">
        <div class="sw"></div><div style="flex:1"><span class="tt">Cargo fijo sin caducidad</span>
          <div class="sd" style="font-size:12px">{recurring ? 'Aplica indefinidamente desde el mes de inicio' : 'Tiene fecha de fin: define cuántos meses dura'}</div></div>
      </button>

      {#if !recurring}
        {#if isDebtCat}
          <div class="row2" style="margin-top:14px">
            <div class="field"><label>Cuotas restantes (meses)</label><input bind:value={installments} inputmode="numeric" placeholder="1" /></div>
            <div class="field"><label>Cuotas iniciales (plazo)</label><input bind:value={totalInstallments} inputmode="numeric" placeholder="Opcional" /></div>
          </div>
          <div class="row2">
            <div class="field"><label>Capital de la deuda</label><input bind:value={principal} inputmode="numeric" placeholder="Sin intereses" /></div>
            <div class="field"><label>Incremento mensual %</label><input bind:value={monthlyIncrease} inputmode="decimal" placeholder="Opcional" /></div>
          </div>
          <div class="field ro"><label>Total a pagar <span class="lock"><Icon name="lock" size={11} /> calculado</span></label><input value={totalDebt()} readonly /></div>
          {#if interest()}
            {@const info = interest()!}
            <div class="callout" style="border-color:var(--coral)">
              <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
                <div><span style="color:var(--text-muted);font-size:12px">Intereses</span><br><b style="color:var(--warn)">{formatMoney(info.interest, store.currency)}</b></div>
                <div><span style="color:var(--text-muted);font-size:12px">Interés total</span><br><b>{info.interestPct.toFixed(1)}%</b></div>
                <div><span style="color:var(--text-muted);font-size:12px">Tasa E.A. aprox.</span><br><b style="color:var(--warn)">{(info.annualRate * 100).toFixed(1)}%</b></div>
              </div>
            </div>
          {/if}
        {:else}
          <div class="row2" style="margin-top:14px">
            <div class="field"><label>Meses que dura</label><input bind:value={installments} inputmode="numeric" placeholder="1" /></div>
            <div class="field"><label>Incremento mensual %</label><input bind:value={monthlyIncrease} inputmode="decimal" placeholder="Opcional" /></div>
          </div>
        {/if}
      {/if}
    {/if}

    <div class="field"><label>Descripción</label><textarea bind:value={description} rows="2" placeholder="Opcional"></textarea></div>

    <div class="modal-actions">
      <button class="btn ghost" onclick={onClose}>Cancelar</button>
      <button class="btn primary" onclick={save}>{concept ? 'Guardar cambios' : 'Crear concepto'}</button>
    </div>
  </div>
</div>
