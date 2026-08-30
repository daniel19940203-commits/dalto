/** Acción Svelte: centra horizontalmente el elemento cuando está activo. */
export function scrollActive(node: HTMLElement, active: boolean) {
  const run = (a: boolean) => {
    if (a) node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };
  run(active);
  return { update: run };
}
