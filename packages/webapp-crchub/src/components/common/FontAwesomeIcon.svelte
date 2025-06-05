<script lang="ts">
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { fas } from '@fortawesome/free-solid-svg-icons';

  // Add all solid icons to the library
  library.add(fas);

  let { icon, size = '1x', color, spin = false, pulse = false, rotation, flip, border = false, pull, className = '' } = $props();

  let classes = $derived(() => {
    const arr = ['fa', `fa-${icon}`];
    if (size) arr.push(`fa-${size}`);
    if (spin) arr.push('fa-spin');
    if (pulse) arr.push('fa-pulse');
    if (rotation) arr.push(`fa-rotate-${rotation}`);
    if (flip) arr.push(`fa-flip-${flip}`);
    if (border) arr.push('fa-border');
    if (pull) arr.push(`fa-pull-${pull}`);
    if (className) arr.push(className);
    return arr.join(' ');
  });

  let style = $derived(() => {
    return color ? `color: ${color};` : '';
  });
</script>

<i class={classes} style={style}></i>

<!-- Svelte default export for component usage -->
