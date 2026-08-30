<script lang="ts">
  import { store } from '../../lib/store.svelte';
  import { formatMoney } from '../../lib/money';
  import Icon from '../../lib/Icon.svelte';
  import {
    availableBalance, totalIncome, totalOf, monthlyDebt, totalDebt,
    savings, savingsRate, emergencyFund, emergencyMonths, debtToIncomeRatio,
    installmentConcepts,
  } from '../../domain/finance';
  import { daysUntil } from '../../domain/agenda/types';
  import { totalPrincipal } from '../../domain/finance/debt';

  const money = (n: number) => formatMoney(n, store.currency);
  const c = $derived(store.effectiveConcepts);

  const av = $derived(availableBalance(c));
  const dti = $derived(debtToIncomeRatio(c));
  const em = $derived(emergencyMonths(c));
  const sr = $derived(savingsRate(c));

  const tier = $derived(
    dti > 30 || av < 0 ? 'red' : em < 3 || sr < 10 ? 'yellow' : 'green',
  );
  const heroVars = $derived(
    tier === 'green' ? '--heroA:rgba(79,209,197,.5);--heroB:rgba(43,38,87,.6)'
    : tier === 'yellow' ? '--heroA:rgba(243,159,90,.45);--heroB:rgba(69,25,82,.6)'
    : '--heroA:rgba(229,84,106,.5);--heroB:rgba(69,25,82,.6)',
  );

  const debts = $derived(installmentConcepts(c));
  const upcoming = $derived(
    store.events
      .map((e) => ({ ...e, dl: daysUntil(e.date) }))
      .filter((e) => e.dl >= 0)
      .sort((a, b) => a.dl - b.dl)
      .slice(0, 2),
  );
  const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
</script>

<div class="view">
  <div class="view-head"><h2>¿Cómo estás hoy?</h2><p>Tu estado financiero en un vistazo</p></div>

  <div class="hero" style={heroVars}>
    <div class="neb"></div>
    <div class="hero-top">
      <span class="hero-label">Saldo disponible del mes</span>
      <span class="lock"><Icon name="lock" size={11} /> calculado</span>
    </div>
    <div class="hero-amount" style="color:{av < 0 ? 'var(--neg)' : 'var(--text)'}">{money(av)}</div>
    <div class="hero-meta">
      <div>Deuda mensual<b style="color:var(--neg)">{money(monthlyDebt(c))}</b></div>
      <div>Deuda total<b style="color:var(--neg)">{money(totalDebt(c))}</b></div>
      {#if totalPrincipal(c) > 0}<div>Capital en deuda<b style="color:var(--warn)">{money(totalPrincipal(c))}</b></div>{/if}
      <div>Ingresos<b style="color:var(--pos)">{money(totalIncome(c))}</b></div>
    </div>
  </div>

  <div class="grid g-4" style="margin-top:14px">
    <div class="stat neg"><div class="lab">Gastos fijos</div><div class="val">{money(totalOf(c, 'fixed'))}</div></div>
    <div class="stat pos"><div class="lab">Ahorro del mes</div><div class="val">{money(savings(c))}</div><div class="sub">Tasa {sr.toFixed(0)}%</div></div>
    <div class="stat {em < 3 ? 'neg' : 'pos'}"><div class="lab">Fondo emergencia</div><div class="val">{money(emergencyFund(c))}</div><div class="sub">{em.toFixed(1)} meses</div></div>
    <div class="stat {dti > 30 ? 'neg' : 'pos'}"><div class="lab">Endeudamiento</div><div class="val">{dti.toFixed(1)}%</div><div class="sub">{dti > 30 ? 'Sobre 30%' : 'Bajo 30%'}</div></div>
  </div>

  <div class="card" style="margin-top:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
      <div style="font-family:var(--display);font-weight:600;font-size:16px">Presión financiera próxima</div>
      <span class="lock"><Icon name="lock" size={11} /> calculado</span>
    </div>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:6px">Cuotas activas y saldo por liquidar</p>
    {#if debts.length}
      {#each debts as d}
        <div class="list-row">
          <div style="flex:1"><b>{d.name}</b><div style="font-size:12px;color:var(--text-muted)">{d.installments} cuotas de {money(d.amount)}</div></div>
          <div style="text-align:right"><div class="mono-num" style="color:var(--neg);font-weight:600;font-family:var(--display)">{money(d.amount * (d.installments ?? 0))}</div><div style="font-size:11px;color:var(--text-muted)">restante</div></div>
        </div>
      {/each}
    {:else}
      <p style="color:var(--text-muted);font-size:14px;padding:6px 0">No tienes deuda con cuotas registrada. 🎉</p>
    {/if}
  </div>

  <div class="card" style="margin-top:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-family:var(--display);font-weight:600;font-size:16px">Próximos eventos</div>
      <button class="chip-btn2" onclick={() => store.go('events')}>Ver agenda</button>
    </div>
    {#if upcoming.length}
      {#each upcoming as e}
        {@const d = new Date(e.date + 'T00:00:00')}
        <div class="list-row">
          <div style="text-align:center;width:52px;flex:none">
            <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--coral);font-weight:600">{DOW[d.getDay()]}</div>
            <div style="font-family:var(--display);font-size:26px;font-weight:700;line-height:1">{d.getDate()}</div>
          </div>
          <div style="flex:1"><div style="font-weight:600;display:flex;align-items:center;gap:8px"><span style="width:9px;height:9px;border-radius:50%;background:{e.color};flex:none"></span>{e.name}</div><div style="font-size:13px;color:var(--text-muted)">{e.category}{e.time ? ' · ' + e.time : ''}</div></div>
          <div style="text-align:right;flex:none"><div style="font-family:var(--display);font-weight:700;color:var(--coral)">{e.dl === 0 ? 'Hoy' : e.dl}</div><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">{e.dl === 0 ? '' : e.dl === 1 ? 'día' : 'días'}</div></div>
        </div>
      {/each}
    {:else}
      <p style="color:var(--text-muted);font-size:14px">Sin eventos próximos.</p>
    {/if}
  </div>
</div>
