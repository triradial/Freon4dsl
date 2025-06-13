<script lang="ts">
    import type { IconBox } from "@freon4dsl/core";
    import { onMount } from "svelte";
    import { componentId } from "./svelte-utils/index.js";
    import { Icon } from '@lucide/svelte';
   
    export let box: IconBox;

    let id: string;
    // Assuming a generic type for iconDef. Adjust according to your needs or based on FontAwesome documentation.
    let iconDef: any; 
    let css: string = "";
    let cursorStyle: string = "";

    onMount( () => {
        box.refreshComponent = refresh;
    });

    $effect(() => {
        box.refreshComponent = refresh;
    });
    
    const refresh = (why?: string) => {
        id = !!box ? componentId(box) : 'icon-for-unknown-box';
        iconDef = box.iconDef;
        css = box.cssClass;
        cursorStyle = box.cursorStyle || 'default';
    }

    refresh();
</script>

<Icon class="w-3 h-3" style="cursor: {cursorStyle};" name={iconDef} />
