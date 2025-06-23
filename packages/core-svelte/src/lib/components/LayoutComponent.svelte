<script lang="ts">
    import { LAYOUT_LOGGER } from './ComponentLoggers.js';

    /**
     * This component shows a list of various boxes (no 'true' list). It can be shown
     * horizontally or vertically. In the latter case, the elements are each separated by
     * a break ('<br>').
     */
    import RenderComponent from './RenderComponent.svelte';
    import { Box, FreLogger, ListDirection, LayoutBox, isNullOrUndefined } from '@freon4dsl/core';
    import { componentId } from '../index.js';
    import ErrorMarker from './ErrorMarker.svelte';
    import type { FreComponentProps } from './svelte-utils/FreComponentProps.js';

    // Props
    let { editor, box, cssClass }: FreComponentProps<LayoutBox> = $props();

    let LOGGER: FreLogger = LAYOUT_LOGGER;
    let id: string = $state('');
    let element: HTMLSpanElement = $state()!;
    let children: Box[] = $state([]);
    let isHorizontal: boolean = $state(true);

    let errorCls: string = $state(''); // css class name for when the node is erroneous
    let errMess: string[] = $state([]); // error message to be shown when element is hovered

    async function setFocus(): Promise<void> {
        if (!isNullOrUndefined(element)) {
            element.focus();
        }
    }

    $effect(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    const refresh = (why?: string): void => {
        LOGGER.log('REFRESH LayoutComponent (' + why + ')' + box?.node?.freLanguageConcept());
        id = !isNullOrUndefined(box) ? componentId(box) : 'layout-for-unknown-box';
        children = [...box.children];
        isHorizontal = box.getDirection() === ListDirection.HORIZONTAL;
        if (box.hasError) {
            errorCls = !isHorizontal
                ? 'layout-component-vertical-error'
                : 'layout-component-horizontal-error';
            errMess = box.errorMessages;
        } else {
            errorCls = '';
            errMess = [];
        }
    };

    $effect(() => {
        // Evaluated and re-evaluated when the box changes.
        refresh('Refresh Layout box changed ' + box?.id);
    });
</script>

{#if errMess.length > 0}
    <ErrorMarker {editor} {box} cssClass={box.cssClass} />
{/if}
<span
    {id}
    class="layout-component {errorCls} {cssClass}"
    class:layout-component-horizontal={isHorizontal}
    class:layout-component-vertical={!isHorizontal}
    class:w-full={!isHorizontal}
    tabindex="-1"
    bind:this={element}
>
    {#if isHorizontal}
        {#each children as child (child.id)}
            <RenderComponent box={child} {editor} cssClass={child.cssClass} />
        {/each}
    {:else}
        {#each children as child (child.id)}
            <RenderComponent box={child} {editor} cssClass={child.cssClass} />
        {/each}
    {/if}
</span>
