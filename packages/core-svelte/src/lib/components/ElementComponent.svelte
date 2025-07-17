<script lang="ts">
    import { ELEMENT_LOGGER } from './ComponentLoggers.js';
    import RenderComponent from './RenderComponent.svelte';
    import { Box, ElementBox, isNullOrUndefined } from '@freon4dsl/core';
    import { componentId } from '../index.js';
    import type { FreComponentProps } from './svelte-utils/FreComponentProps.js';
    import { onMount } from 'svelte';

    let initialized = false;
    let singularity = false;

    let { editor, box }: FreComponentProps<ElementBox> = $props();

    const LOGGER = ELEMENT_LOGGER;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let id: string = $state('');

    let childBox: Box | undefined = $state(undefined);
    
    onMount(() => { 
        initialized = true; 
    });

    const refresh = (why?: string): void => {
        LOGGER.log('Refresh (' + why + ')' + box?.node?.freLanguageConcept());
        if (!isNullOrUndefined(box)) {
            id = componentId(box);
            childBox = box.content;
        } else {
            id = 'element-for-unknown-box';
        }
    };

    async function setFocus(): Promise<void> {
        LOGGER.log('ElementComponent.setFocus for box ' + box.role);
        if (!isNullOrUndefined(box)) {
            box.content.setFocus();
        }
    }

    $effect(() => {
        if (!initialized) return;
        if (singularity) return;

        // runs after the initial onMount
        LOGGER.log('Effect:' + box.id);
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
        refresh(box?.$id);
        singularity = true;
    });

</script>

{#if !isNullOrUndefined(childBox)}
    <RenderComponent box={childBox} {editor} />
{/if}
