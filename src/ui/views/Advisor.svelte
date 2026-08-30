<script lang="ts">
  import { store } from '../../lib/store.svelte';
  import { formatMoney } from '../../lib/money';
  import { diagnose, PILLARS } from '../../domain/finance/advisor';
  import Icon from '../../lib/Icon.svelte';

  const money = (n: number) => formatMoney(n, store.currency);
  const d = $derived(diagnose(store.effectiveConcepts));
  let openPillar = $state<'debt' | 'invest' | 'edu' | null>(null);
  const detail = $derived(openPillar ? PILLARS[openPillar] : null);
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
    </div>
  </div>

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
