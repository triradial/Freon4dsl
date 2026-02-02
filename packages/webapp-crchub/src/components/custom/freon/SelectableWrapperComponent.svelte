<script lang="ts">
    import { AST } from "@freon4dsl/core";
    import type { FreComponentProps } from "@freon4dsl/core-svelte";
    import { isPartReplacerBox, type Box } from "@freon4dsl/core";
    import { tick, getContext, setContext } from "svelte";
    import type { Snippet } from "svelte";

    // Context key for tracking nested wrappers
    const WRAPPER_CONTEXT_KEY = Symbol('selectable-wrapper-context');
    
    // Context type for tracking active wrapper in nested scenarios
    interface WrapperContext {
        // Register a child wrapper
        registerChild: (id: string) => void;
        // Unregister a child wrapper
        unregisterChild: (id: string) => void;
        // Check if any child is currently active (hovered/focused)
        hasActiveChild: () => boolean;
        // Set if this wrapper is active
        setChildActive: (id: string, active: boolean) => void;
    }

    interface Props {
        box: Box;
        editor: any;
        onDelete?: () => void;
    }

    let { box, editor, children, onDelete }: FreComponentProps<Box> & { children: Snippet, onDelete?: () => void } = $props();
    
    // Generate unique ID for this wrapper instance
    const wrapperId = `wrapper-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get parent wrapper context (if nested inside another wrapper)
    const parentContext = getContext<WrapperContext | undefined>(WRAPPER_CONTEXT_KEY);
    
    // Track child wrappers and their active state
    let childWrappers = $state<Map<string, boolean>>(new Map());
    
    // Create context for child wrappers
    const selfContext: WrapperContext = {
        registerChild: (id: string) => {
            childWrappers.set(id, false);
            childWrappers = new Map(childWrappers); // Trigger reactivity
        },
        unregisterChild: (id: string) => {
            childWrappers.delete(id);
            childWrappers = new Map(childWrappers); // Trigger reactivity
        },
        hasActiveChild: () => {
            for (const [_, active] of childWrappers) {
                if (active) return true;
            }
            return false;
        },
        setChildActive: (id: string, active: boolean) => {
            childWrappers.set(id, active);
            childWrappers = new Map(childWrappers); // Trigger reactivity
        }
    };
    
    // Provide context to children
    setContext(WRAPPER_CONTEXT_KEY, selfContext);
    
    // Register with parent on mount
    $effect(() => {
        if (parentContext) {
            parentContext.registerChild(wrapperId);
            return () => {
                parentContext.unregisterChild(wrapperId);
            };
        }
        return () => {}; // No-op cleanup when no parent context
    });
    
    // Track hover state
    let isHovered = $state(false);
    
    // Track focus state
    let isFocused = $state(false);
    
    // Notify parent when this wrapper becomes active/inactive
    $effect(() => {
        const isActive = isHovered || isFocused;
        if (parentContext) {
            parentContext.setChildActive(wrapperId, isActive);
        }
    });
    
    // Check if any child wrapper is currently active
    let hasActiveChild = $derived.by(() => {
        for (const [_, active] of childWrappers) {
            if (active) return true;
        }
        return false;
    });
    
    // Track if this box is selected
    // Note: We check if the box or its children match editor.selectedBox
    let isSelected = $derived.by(() => {
        const selectedBox = editor?.selectedBox;
        if (!selectedBox) return false;
        // Check if this box is selected, or if any child box in the selection chain matches
        return selectedBox === box || selectedBox.parent === box || checkIfSelected(selectedBox, box);
    });
    
    function checkIfSelected(selected: Box, target: Box): boolean {
        let current: Box | null = selected;
        while (current) {
            if (current === target) return true;
            current = current.parent;
        }
        return false;
    }
    
    // Check if selection is on a nested child (should hide this wrapper's styling)
    let hasSelectedChild = $derived.by(() => {
        const selectedBox = editor?.selectedBox;
        if (!selectedBox || selectedBox === box) return false;
        // If selected box is a descendant of this box (but not this box itself), hide styling
        return checkIfSelected(selectedBox, box) && selectedBox !== box;
    });
    
    // Combined state for showing blue border and delete button
    // Hide styling if a child wrapper is active (hovered/focused) or has selection
    let showWrapper = $derived((isSelected || isHovered || isFocused) && !hasActiveChild && !hasSelectedChild);

    // Only show delete button if the box is actually deletable (PartReplacerBox) OR custom delete handler provided
    let canDelete = $derived(isPartReplacerBox(box) || !!onDelete);
    let showDeleteButton = $derived(showWrapper && canDelete);
    
    let wrapperElement: HTMLElement | null = $state(null);
    
    // Handle click to select
    function handleClick(event: MouseEvent) {
        if (isPartReplacerBox(box)) {
            editor.selectElementForBox(box);
            event.preventDefault();
            event.stopPropagation();
        }
    }
    
    // Delete the value - consolidated function
    function deleteValue() {
        console.log('🟢 SelectableWrapperComponent: deleteValue() called', {
            boxKind: box?.kind,
            boxId: (box as any)?.id,
            hasPropertyName: !!(box as any)?.propertyName,
            propertyName: (box as any)?.propertyName,
            hasCustomDeleteHandler: !!onDelete
        });

        // If custom delete handler provided, use it
        if (onDelete) {
            console.log('🟢 SelectableWrapperComponent: Using custom delete handler');
            onDelete();
            return;
        }

        // Double-check that box is still a PartReplacerBox (it might have changed)
        if (!isPartReplacerBox(box)) {
            console.warn('🔴 SelectableWrapperComponent: Cannot delete - box is not a PartReplacerBox', {
                boxKind: box?.kind,
                propertyName: (box as any)?.propertyName,
                boxId: (box as any)?.id
            });
            return;
        }
        
        const partReplacerBox = box; // TypeScript knows this is PartReplacerBox now
        const propertyName = partReplacerBox.propertyName;
        
        if (!propertyName) {
            console.warn('🔴 SelectableWrapperComponent: Cannot delete - no propertyName', {
                boxKind: box?.kind,
                boxId: (box as any)?.id
            });
            return;
        }
        
        console.log('🟢 SelectableWrapperComponent: Proceeding with deletion', {
            propertyName,
            boxId: (box as any)?.id,
            hasRefreshComponent: !!partReplacerBox.refreshComponent
        });
        
        try {
            // Log current value before deletion
            const currentNodeValue = partReplacerBox.node[propertyName];
            console.log('🟢 SelectableWrapperComponent: Before deletion', {
                propertyName,
                currentNodeValue: currentNodeValue?.freLanguageConcept?.(),
                nodeId: (partReplacerBox.node as any).freId,
                nodeType: partReplacerBox.node.freLanguageConcept?.()
            });
            
            AST.changeNamed(`SelectableWrapperComponent: Remove ${propertyName}`, () => {
                console.log('🟢 SelectableWrapperComponent: Setting property value to null', { propertyName });
                partReplacerBox.setPropertyValue(null);
            });
            
            // Log value after deletion (within the same tick)
            tick().then(() => {
                const valueAfterDelete = partReplacerBox.node[propertyName];
                console.log('🟢 SelectableWrapperComponent: After deletion (AST change)', {
                    propertyName,
                    valueAfterDelete: valueAfterDelete?.freLanguageConcept?.(),
                    isNull: valueAfterDelete === null,
                    isUndefined: valueAfterDelete === undefined,
                    nodeId: (partReplacerBox.node as any).freId
                });
            });
            
            console.log('🟢 SelectableWrapperComponent: AST change completed, blurring element');
            
            // Remove focus to trigger blur (similar to clicking outside)
            if (wrapperElement) {
                wrapperElement.blur();
            }
            
            // Wait for AST change to propagate, then refresh the component
            // CustomActionsComponent sets box.refreshComponent = refresh, so call it directly
            tick().then(() => {
                console.log('🟢 SelectableWrapperComponent: After tick, refreshing component', {
                    propertyName,
                    hasRefreshComponent: !!partReplacerBox.refreshComponent
                });
                
                // Call refreshComponent on the box itself - CustomActionsComponent sets this
                // Use partReplacerBox here since we know it's valid
                if (partReplacerBox.refreshComponent) {
                    partReplacerBox.refreshComponent();
                    console.log('🟢 SelectableWrapperComponent: refreshComponent called successfully');
                } else {
                    console.warn('🔴 SelectableWrapperComponent: box.refreshComponent not available after deletion', {
                        propertyName,
                        boxKind: box?.kind,
                        boxId: (box as any)?.id
                    });
                }
            });
        } catch (error) {
            console.error('🔴 SelectableWrapperComponent: Error during deletion', error, {
                propertyName,
                boxKind: box?.kind,
                boxId: (box as any)?.id
            });
        }
    }
    
    // Handle delete key to remove value
    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Delete" || event.key === "Backspace") {
            console.log('🟢 SelectableWrapperComponent: Delete/Backspace key pressed', {
                key: event.key,
                canDelete,
                boxKind: box?.kind,
                propertyName: (box as any)?.propertyName
            });
            if (canDelete) {
                event.preventDefault();
                event.stopPropagation();
                deleteValue();
            } else {
                console.warn('🟡 SelectableWrapperComponent: Delete key pressed but canDelete is false', {
                    boxKind: box?.kind,
                    propertyName: (box as any)?.propertyName
                });
            }
        }
    }
    
    // Handle delete button click
    function handleDeleteClick(event: MouseEvent) {
        console.log('🟢 SelectableWrapperComponent: handleDeleteClick called', {
            boxKind: box?.kind,
            propertyName: (box as any)?.propertyName,
            canDelete
        });
        event.preventDefault();
        event.stopPropagation();
        deleteValue();
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    bind:this={wrapperElement}
    class="custom-selectable-wrapper"
    class:selected={showWrapper}
    onclick={handleClick}
    onkeydown={handleKeyDown}
    onmouseenter={() => isHovered = true}
    onmouseleave={() => isHovered = false}
    onfocus={() => isFocused = true}
    onblur={() => isFocused = false}
    tabindex="0"
    role="group"
>
    {#if showDeleteButton}
        <button
            class="custom-selectable-wrapper-delete"
            onclick={handleDeleteClick}
            type="button"
            aria-label="Delete"
            title="Delete"
            tabindex="-1"
        >
            ×
        </button>
    {/if}
    <span class="custom-selectable-wrapper-content" class:with-underline={!showWrapper}>
        {@render children()}
    </span>
</div>

