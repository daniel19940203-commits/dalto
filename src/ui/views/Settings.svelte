<script lang="ts">
  import { store } from '../../lib/store.svelte';
  import { toast } from '../../lib/toast.svelte';
  import Icon from '../../lib/Icon.svelte';
  import ResetModal from '../ResetModal.svelte';

  let showResetModal = $state(false);
  let fileInput: HTMLInputElement;

  async function onImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try { await store.importBackup(file); toast.show('Respaldo importado'); }
    catch { toast.show('Archivo no válido'); }
    (e.target as HTMLInputElement).value = '';
  }
</script>

<div class="view">
  <div class="view-head"><h2>Ajustes</h2><p>Personaliza DALTO</p></div>

  {#if store.account}
    <div class="card" style="margin-bottom:16px;display:flex;align-items:center;gap:14px">
      <div style="width:48px;height:48px;border-radius:50%;flex:none;display:grid;place-items:center;background:linear-gradient(135deg,var(--coral),var(--rose));color:#fff;font-family:var(--display);font-weight:700;font-size:20px">{store.userName.charAt(0).toUpperCase()}</div>
      <div style="flex:1">
        <div style="font-family:var(--display);font-weight:600;font-size:17px">{store.userName}</div>
        <div style="font-size:13px;color:var(--text-muted)">{store.account.email}</div>
        <div style="font-size:12px;color:var(--text-muted)">{store.account.phone}</div>
      </div>
      <button class="btn ghost" style="flex:none;padding:10px 14px" onclick={() => store.logout()}>Cerrar sesión</button>
    </div>
  {/if}

  <div class="card">
    <div class="set-row"><div><div class="st">Moneda</div><div class="sd">Solo cambia la visualización, no los valores guardados</div></div>
      <div class="seg"><button class:on={store.currency === 'COP'} onclick={() => store.setCurrency('COP')}>COP</button><button class:on={store.currency === 'USD'} onclick={() => store.setCurrency('USD')}>USD</button></div></div>
    <div class="set-row"><div><div class="st">Periodo financiero</div><div class="sd">Cómo se agrupan los datos</div></div>
      <div class="seg"><button class:on={store.period === 'monthly'} onclick={() => store.setPeriod('monthly')}>Mensual</button><button class:on={store.period === 'semiMonthly'} onclick={() => store.setPeriod('semiMonthly')}>Quincenal</button></div></div>
    <div class="set-row"><div><div class="st">Tema</div><div class="sd">Apariencia</div></div>
      <div class="seg"><button class:on={store.theme === 'dark'} onclick={() => store.setTheme('dark')}><Icon name="moon" size={15} /> Oscuro</button><button class:on={store.theme === 'light'} onclick={() => store.setTheme('light')}><Icon name="sun" size={15} /> Claro</button></div></div>
  </div>

  <div class="card" style="margin-top:16px">
    <button class="toggle" class:on={store.autofill} onclick={() => store.setAutofill(!store.autofill)} type="button">
      <div class="sw"></div><div style="flex:1"><span class="tt">Auto-completar periodos futuros</span>
        <div class="sd" style="font-size:12px">Proyecta cuotas y recurrentes a meses siguientes</div></div>
    </button>
  </div>

  <div class="card" style="margin-top:16px">
    <div style="font-family:var(--display);font-weight:600;margin-bottom:4px">Respaldo de datos</div>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px">Tus datos viven solo en este dispositivo. Expórtalos con frecuencia.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn ghost" style="flex:none;padding:11px 18px" onclick={() => store.exportBackup()}><Icon name="download" size={16} /> Exportar JSON</button>
      <button class="btn ghost" style="flex:none;padding:11px 18px" onclick={() => fileInput.click()}><Icon name="upload" size={16} /> Importar</button>
      <input bind:this={fileInput} type="file" accept="application/json" style="display:none" onchange={onImport} />
    </div>
  </div>

  <div class="card" style="margin-top:16px;border-color:rgba(229,84,106,.35)">
    <div style="font-family:var(--display);font-weight:600;margin-bottom:4px;color:var(--neg)">Zona de peligro</div>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px">Elimina todos los conceptos y eventos y deja los valores en 0. No se puede deshacer.</p>
    <button class="btn danger" style="flex:none;padding:11px 18px" onclick={() => (showResetModal = true)}><Icon name="trash" size={16} /> Restablecer todo</button>
  </div>

  <p style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:20px">DALTO · {store.userName || 'Tu control financiero'}</p>
</div>

{#if showResetModal}<ResetModal onClose={() => (showResetModal = false)} />{/if}
