<script lang="ts">
  import { store } from '../../lib/store.svelte';
  import { formatMoney } from '../../lib/money';
  import { diagnose, PILLARS } from '../../domain/finance/advisor';
  import { debtPayoffPlans, investmentAdvice } from '../../domain/finance/advisor-actions';
  import Icon from '../../lib/Icon.svelte';

  const money = (n: number) => formatMoney(n, store.currency);
  const d = $derived(diagnose(store.effectiveConcepts));
  let openPillar = $state<'debt' | 'invest' | 'edu' | null>(null);
  const detail = $derived(openPillar ? PILLARS[openPillar] : null);

  let showActions = $state(false);
  const plans = $derived(debtPayoffPlans(store.effectiveConcepts));
  const invest = $derived(investmentAdvice(store.effectiveConcepts));
</script>

<div class="view">
  <div class="view-head"><h2>Asesor financiero</h2><p>Diagnóstico basado en tus datos reales</p></div>

  <div class="semaforo sem-{d.tier}">
    <div class="dot"></div>
    <div style="flex:1">
      <h3>{d.title}</h3>
      <p>{d.msg}</p>
      <div class="metric-mini">
        <div><span>Endeudamiento</span><b style="color:{d.dti > 30 ? 'var(--neg)' : 'var(--pos)'}">{d.dti.toFixed(1)}%</b></div>
        <div><span>Fondo emergencia</span><b style="color:{d.em < 3 ? 'var(--neg)' : 'var(--pos)'}">{d.em.toFixed(1)} meses</b></div>
        <div><span>Flujo libre</span><b style="color:{d.av < 0 ? 'var(--neg)' : 'var(--pos)'}">{money(d.av)}</b></div>
        <div><span>Tasa de ahorro</span><b>{d.sr.toFixed(0)}%</b></div>
      </div>
      <button class="btn primary" style="margin-top:16px;max-width:260px" onclick={() => (showActions = !showActions)}>
        <Icon name="compass" size={16} /> {showActions ? 'Ocultar acciones' : 'Acciones recomendadas'}
      </button>
    </div>
  </div>

  {#if showActions}
    <div class="actions-panel">
      {#if d.focus === 'invest'}
        <h3><Icon name="trending-up" size={18} /> Cuánto invertir</h3>
        <div class="act-grid">
          <div class="act-cell"><span>Puedes invertir</span><b style="color:var(--teal)">{money(invest.investable)}</b></div>
          <div class="act-cell"><span>Mantén líquido</span><b style="color:var(--coral)">{money(invest.keepLiquid)}</b></div>
        </div>
        <p class="act-note">{invest.rationale}</p>
        <p class="act-fine">Contenido educativo, no una recomendación de compra. Diversifica y usa costo promedio (DCA).</p>
      {:else}
        <h3><Icon name="trending-down" size={18} /> Qué deuda pagar primero</h3>
        {#if plans.avalanche.length}
          <p class="act-sub">Tienes dos estrategias válidas — elige la que se ajuste a ti:</p>

          <div class="plan">
            <div class="plan-head"><b>Avalancha</b><span>Ahorra más dinero — ataca la de mayor interés</span></div>
            {#each plans.avalanche as it, i}
              <div class="plan-row">
                <span class="plan-n">{i + 1}</span>
                <div style="flex:1"><b>{it.concept.name}</b><div class="plan-meta">Saldo {money(it.balance)}{it.annualRate !== null ? ` · E.A. ${(it.annualRate * 100).toFixed(1)}%` : ''}</div></div>
              </div>
            {/each}
          </div>

          <div class="plan">
            <div class="plan-head"><b>Bola de nieve</b><span>Motiva más — liquida primero la más pequeña</span></div>
            {#each plans.snowball as it, i}
              <div class="plan-row">
                <span class="plan-n">{i + 1}</span>
                <div style="flex:1"><b>{it.concept.name}</b><div class="plan-meta">Saldo {money(it.balance)}{it.annualRate !== null ? ` · E.A. ${(it.annualRate * 100).toFixed(1)}%` : ''}</div></div>
              </div>
            {/each}
          </div>
          <p class="act-fine">Mantén los mínimos de todas y vuelca cada peso extra a la deuda #1 de la estrategia elegida. Al liquidarla, pasa su cuota a la siguiente.</p>
        {:else}
          <p class="act-note">No tienes deudas con cuotas registradas. 🎉 Tu foco es fortalecer el fondo de emergencia y luego invertir.</p>
        {/if}
      {/if}
    </div>
  {/if}

  <div style="font-family:var(--display);font-weight:600;margin:22px 0 4px;font-size:16px">Explora un pilar</div>
  <div class="pillars">
    <button class="pillar debt" class:active={openPillar === 'debt'} onclick={() => (openPillar = 'debt')}>
      <div class="pic"><Icon name="trending-down" size={24} /></div><h4>Salir de deudas</h4><p>Bola de nieve, avalancha y abonos a capital</p></button>
    <button class="pillar invest" class:active={openPillar === 'invest'} onclick={() => (openPillar = 'invest')}>
      <div class="pic"><Icon name="trending-up" size={24} /></div><h4>Inversión</h4><p>Cómo pensar el riesgo, no qué comprar</p></button>
    <button class="pillar edu" class:active={openPillar === 'edu'} onclick={() => (openPillar = 'edu')}>
      <div class="pic"><Icon name="compass" size={24} /></div><h4>Educación</h4><p>Habilidades financieras para desarrollar</p></button>
  </div>

  {#if detail}
    <div class="advisor-detail">
      <h3>{detail.title}</h3>
      <p style="color:var(--text-2);font-size:14px;margin-bottom:6px">{detail.intro}</p>
      <div class="callout">{detail.note}</div>
      {#each detail.steps as [t, body], i}
        <div class="step"><div class="n">{i + 1}</div><div><b>{t}</b><p>{body}</p></div></div>
      {/each}
    </div>
  {/if}
</div>
