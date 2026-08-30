<script lang="ts">
  import { toast } from '../lib/toast.svelte';
  import Icon from '../lib/Icon.svelte';
</script>

<div class="toast" class:on={toast.visible}>
  <Icon name="check" size={17} />{toast.message}
</div>
