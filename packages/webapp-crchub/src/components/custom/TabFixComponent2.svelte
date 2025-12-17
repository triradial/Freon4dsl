<script lang="ts">
    import { FragmentWrapperBox } from "@freon4dsl/core";
    import { componentId, RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { onMount } from "svelte";
// ts-ignore
    import { ChevronRight as IconChevronRight } from '@lucide/svelte';

    const { editor, box }: FreComponentProps<FragmentWrapperBox> = $props();

    // Props
    let cssClass = box && box.findParam("cssClass") || "";

    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    
    // Check if child has an editable box
    let hasEditableChild = $derived(() => {
        const childBox = box?.childBox;
        if (!childBox) return false;
        const editableChild = childBox.firstEditableChild;
        return editableChild !== undefined && editableChild !== childBox;
    });
    
    // Dynamic background color based on dark/light mode
    let childWrapperStyle = $derived(() => {
        // Check for dark mode
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return isDark 
            ? 'background-color: rgba(255, 255, 255, 0.25) !important; padding: 2px 4px; display: inline-block; min-height: 1.5em;'
            : 'background-color: rgba(0, 0, 0, 0.25) !important; padding: 2px 4px; display: inline-block; min-height: 1.5em;';
    });

    // Function to handle focus when container receives focus (for tabbing)
    async function handleContainerFocus(): Promise<void> {
        const childBox = box.childBox;
        if (childBox) {
            // Try to find the first editable child within childBox
            const editableChild = childBox.firstEditableChild;
            if (editableChild && editableChild !== childBox) {
                // Select and focus the editable child
                editor.selectElementForBox(editableChild);
                await editableChild.setFocus();
            } else {
                // If no editable child, select the childBox itself (could be a label)
                // Ensure it's selectable first
                if (!childBox.selectable) {
                    // Make it selectable temporarily if needed
                    (childBox as any).selectable = true;
                }
                // Use selectElementForBox to ensure Freon recognizes it, not the parent
                editor.selectElementForBox(childBox);
                // Verify the selection was set correctly
                if (editor.selectedBox !== childBox) {
                    // If selection didn't stick, try selecting a leaf within it
                    const leaf = childBox.firstLeaf;
                    if (leaf && leaf !== childBox) {
                        editor.selectElementForBox(leaf);
                    }
                }
            }
        }
    }

    // The following functions need to be included for the editor to function properly.
    async function setFocus(): Promise<void> {
        // Same logic as handleContainerFocus - find editable child or use childBox
        const childBox = box.childBox;
        if (childBox) {
            const editableChild = childBox.firstEditableChild;
            if (editableChild && editableChild !== childBox) {
                editor.selectElementForBox(editableChild);
                await editableChild.setFocus();
            } else {
                // Select the childBox in Freon's editor so it's recognized (not the parent)
                editor.selectElementForBox(childBox);
                // Wait a tick to ensure selection propagates
                await new Promise(resolve => setTimeout(resolve, 0));
                if (childBox.setFocus) {
                    await childBox.setFocus();
                }
            }
        }
    }

    const refresh = (why?: string): void => {
        box.childBox.refreshComponent(why);
        box.refreshComponent = refresh;
    };

    onMount(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    $effect(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    })

 </script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="{id}" class="item-group {cssClass}" tabindex="0" onfocus={() => handleContainerFocus()}>
    {#if !hasEditableChild()}
        <button class="btn-icon p-0 ml-1 mr-1 toggle-button" tabindex="-1">
            <IconChevronRight size={16} />
        </button>
    {/if}
    <div class="tabfix-child-wrapper" style={childWrapperStyle()}>
        <RenderComponent box={box.childBox} {editor} />
    </div>
</div>

<style>
    /* Light mode: slightly darker background */
    .tabfix-child-wrapper {
        background-color: rgba(0, 0, 0, 0.25) !important;
        padding: 2px 4px;
        display: inline-block;
        min-height: 1.5em;
    }
    
    /* Dark mode: slightly lighter background */
    @media (prefers-color-scheme: dark) {
        .tabfix-child-wrapper {
            background-color: rgba(255, 255, 255, 0.25) !important;
        }
    }
    
    /* If using a dark mode class instead of media query */
    :global(.dark) .tabfix-child-wrapper,
    :global([data-theme="dark"]) .tabfix-child-wrapper {
        background-color: rgba(255, 255, 255, 0.25) !important;
    }
</style>
