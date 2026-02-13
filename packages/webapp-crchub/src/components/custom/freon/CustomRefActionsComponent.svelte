<script lang="ts">
    import {
        AST,
        BoxFactory,
        FreCustomAction,
        FreLanguage,
        FreNodeReference,
        isRefReplacerBox,
        type FreEditor,
        type SelectOption
    } from "@freon4dsl/core";
    import type { FreComponentProps } from "@freon4dsl/core-svelte";
    import { componentId } from "@freon4dsl/core-svelte";
    import { onMount, tick } from "svelte";
    import SelectableWrapperComponent from "./SelectableWrapperComponent.svelte";

    // Set to true to enable debug logging
    let loggingEnabled = false;

    function logInfo(...args: any[]) {
        if (loggingEnabled) console.log('[CustomRefActions]', ...args);
    }

    let { editor, box, isEditing = $bindable(false) }: FreComponentProps<any> & { isEditing?: boolean } = $props();

    // Validate that we received a RefReplacerBox
    $effect(() => {
        if (!isRefReplacerBox(box)) {
            console.error('CustomRefActionsComponent: Expected RefReplacerBox but got', box?.kind);
        }
    });

    // State
    let text = $state('');
    let dropdownOpen = $state(false);
    let selectedIndex = $state(-1);
    let propertyValueVersion = $state(0);

    // DOM references
    let componentWrapper: HTMLElement | null = $state(null);
    let inputElement: HTMLInputElement | null = $state(null);
    let widthSpan: HTMLSpanElement | null = $state(null);
    let dropdownElement: HTMLElement | null = $state(null);

    // Component ID
    const id = $derived(box ? componentId(box) : 'custom-ref-actions-unknown');

    // Get placeholder from box params
    let placeholderText = $derived(box?.findParam?.("placeholder") || `+ ${box?.propertyName || 'reference'}`);

    // Get current reference value (FreNodeReference has 'referred' property)
    let currentValue = $derived.by(() => {
        propertyValueVersion; // Force reactivity
        if (isRefReplacerBox(box) && box.propertyName) {
            const value = box.node[box.propertyName];
            if (value && typeof value === 'object' && 'referred' in value) {
                return value as FreNodeReference<any>;
            }
        }
        return null;
    });

    // Check if we have a value
    let hasValue = $derived(currentValue !== null);

    // Get display name for the reference
    let displayName = $derived(currentValue?.name || currentValue?.referred?.name || 'Unknown');

    // Get reference options from scoper
    let referenceOptions = $derived.by(() => {
        propertyValueVersion; // Force reactivity
        if (!isRefReplacerBox(box) || !box.propertyName) return [];

        const lang = FreLanguage.getInstance();
        const nodeConcept = box.node.freLanguageConcept();
        const propInfo = lang.classifierProperty(nodeConcept, box.propertyName);
        const propType = propInfo?.type;

        if (!propType) {
            logInfo('Could not get property type for', box.propertyName);
            return [];
        }

        // Get visible nodes from scoper
        const visibleNodes = editor.environment.scoper
            .getVisibleNodes(box.node, propType)
            .filter((n) => !!n.name && n.name !== "");

        logInfo('Reference options', {
            propType,
            count: visibleNodes.length,
            names: visibleNodes.map(n => n.name)
        });

        // Create options
        return visibleNodes.map((visibleNode) => ({
            id: `${nodeConcept}-${visibleNode.name}`,
            label: visibleNode.name,
            node: visibleNode
        }));
    });

    // Filter options based on search text
    let filteredOptions = $derived.by(() => {
        if (!text.trim()) return referenceOptions;
        const searchText = text.toLowerCase().trim();
        return referenceOptions.filter(opt =>
            opt.label.toLowerCase().startsWith(searchText)
        );
    });

    // Match count for indicator
    let matchCount = $derived(text.trim() ? filteredOptions.length : 0);
    let hasSingleMatch = $derived(matchCount === 1);
    let hasNoMatches = $derived(matchCount === 0 && text.trim().length > 0);

    // Select a reference
    function selectReference(option: typeof referenceOptions[0]) {
        if (!option || !isRefReplacerBox(box)) return;

        logInfo('Selecting reference', option.label);

        AST.changeNamed(`Set reference to ${option.label}`, () => {
            box.node[box.propertyName] = FreNodeReference.create(option.node.name, null);
        });

        propertyValueVersion++;
        endEditing();
    }

    // Clear the reference
    function clearReference() {
        if (!isRefReplacerBox(box)) return;

        logInfo('Clearing reference');

        AST.changeNamed(`Clear reference ${box.propertyName}`, () => {
            box.node[box.propertyName] = null;
        });

        propertyValueVersion++;
    }

    // Start editing
    async function startEditing() {
        logInfo('startEditing', { hasValue });
        isEditing = true;
        dropdownOpen = true;
        selectedIndex = -1;
        text = '';
        await tick();
        if (inputElement) {
            inputElement.focus();
            setInputWidth();
        }
    }

    // End editing
    function endEditing() {
        isEditing = false;
        dropdownOpen = false;
        text = '';
        selectedIndex = -1;
    }

    // Handle click on value or placeholder
    function onMouseDown(event: MouseEvent) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();

        if (hasValue) {
            // Clear the reference and show dropdown
            clearReference();
            tick().then(() => startEditing());
        } else {
            startEditing();
        }
    }

    // Handle keyboard on span
    function onSpanKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            if (hasValue) {
                clearReference();
                tick().then(() => startEditing());
            } else {
                startEditing();
            }
        }
    }

    // Handle focus on span
    function onSpanFocusIn() {
        if (!hasValue) {
            startEditing();
        }
    }

    // Handle input change
    function onInputChange(e: Event) {
        text = (e.target as HTMLInputElement).value;
        dropdownOpen = true;
        selectedIndex = -1;
        tick().then(() => setInputWidth());
    }

    // Handle keydown on input
    function onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Tab') {
            checkAndSelect();
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            endEditing();
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            checkAndSelect();
            return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();

            if (!dropdownOpen) dropdownOpen = true;
            if (filteredOptions.length === 0) return;

            if (event.key === 'ArrowDown') {
                selectedIndex = selectedIndex < filteredOptions.length - 1 ? selectedIndex + 1 : 0;
            } else {
                selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredOptions.length - 1;
            }

            // Update text to show selected item
            if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
                text = filteredOptions[selectedIndex].label;
                tick().then(() => setInputWidth());
            }
            return;
        }

        // Allow navigation and editing keys
        if (
            event.key === "Backspace" ||
            event.key === "Delete" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key.length === 1
        ) {
            event.stopPropagation();
        }
    }

    // Check for match and select
    function checkAndSelect() {
        // If user has selected with arrow keys
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
            selectReference(filteredOptions[selectedIndex]);
            return;
        }

        // Check for exact match
        const searchText = text.trim().toLowerCase();
        if (searchText) {
            const exactMatch = referenceOptions.find(opt =>
                opt.label.toLowerCase() === searchText
            );
            if (exactMatch) {
                selectReference(exactMatch);
                return;
            }

            // Check for single match
            if (filteredOptions.length === 1) {
                selectReference(filteredOptions[0]);
                return;
            }
        }

        endEditing();
    }

    // Handle focus out
    function onFocusOut(event: FocusEvent) {
        const relatedTarget = event.relatedTarget as HTMLElement;

        if (relatedTarget) {
            if (
                (inputElement && inputElement.contains(relatedTarget)) ||
                (dropdownElement && dropdownElement.contains(relatedTarget)) ||
                (componentWrapper && componentWrapper.contains(relatedTarget))
            ) {
                return;
            }
        }

        setTimeout(() => {
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement) {
                if (
                    (inputElement && inputElement.contains(activeElement)) ||
                    (dropdownElement && dropdownElement.contains(activeElement)) ||
                    (componentWrapper && componentWrapper.contains(activeElement))
                ) {
                    return;
                }
            }
            checkAndSelect();
        }, 100);
    }

    // Handle click outside
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (isEditing) {
            if (
                componentWrapper &&
                !componentWrapper.contains(target) &&
                !(inputElement && inputElement.contains(target)) &&
                !(dropdownElement && dropdownElement.contains(target))
            ) {
                checkAndSelect();
            }
        }
    }

    $effect(() => {
        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
        return () => {};
    });

    // Set input width
    function setInputWidth() {
        if (widthSpan && inputElement) {
            let displayValue = inputElement.value || text || placeholderText;
            if (!displayValue || displayValue.length === 0) {
                displayValue = " ";
            }
            widthSpan.textContent = displayValue;
            const newWidth = Math.max(widthSpan.offsetWidth, 16);
            inputElement.style.width = `${newWidth}px`;
        }
    }

    // Update input width when text changes
    $effect(() => {
        if (isEditing) {
            tick().then(() => setInputWidth());
        }
    });

    // Set focus function
    async function setFocus() {
        if (isEditing && inputElement) {
            inputElement.focus();
        } else {
            await startEditing();
        }
    }

    // Refresh function
    const refresh = (why?: string): void => {
        text = '';
        propertyValueVersion++;
        logInfo('refresh', why);
    };

    onMount(() => {
        if (box) {
            box.setFocus = setFocus;
            box.refreshComponent = refresh;
        }
    });

    $effect(() => {
        if (box) {
            box.setFocus = setFocus;
            box.refreshComponent = refresh;
        }
    });
</script>

<span
    bind:this={componentWrapper}
    class="custom-ref-action-component {box?.cssClass || ''}"
    role="none"
    {id}
>
    {#if hasValue && !isEditing}
        <!-- View mode: Show reference name with selectable wrapper for delete functionality -->
        <SelectableWrapperComponent {box} {editor} onDelete={clearReference}>
            <span
                class="custom-select-text cursor-pointer"
                tabindex="0"
                role="textbox"
                onmousedown={onMouseDown}
                onkeydown={onSpanKeyDown}
                title="Click to change reference"
            >
                {displayName}
            </span>
        </SelectableWrapperComponent>
    {:else if isEditing}
        <!-- Edit mode: Show input with dropdown -->
        <div class="text-dropdown-component-text-wrapper" style="position: relative; display: inline-block;">
            <!-- Hidden span to measure text width -->
            <span
                bind:this={widthSpan}
                style="visibility: hidden; position: absolute; white-space: pre; font-family: var(--font-family-sans); font-size: var(--standard-font-size); padding: 0.15rem 0.25rem 0 0.3rem;"
            >
                {text || placeholderText}
            </span>
            <input
                bind:this={inputElement}
                type="text"
                bind:value={text}
                placeholder={placeholderText}
                oninput={onInputChange}
                onkeydown={onKeyDown}
                onfocusout={onFocusOut}
                class="custom-select-input"
                style="min-width: 2ch;"
                autocomplete="off"
            />
            {#if dropdownOpen && referenceOptions.length > 0}
                <div
                    bind:this={dropdownElement}
                    class="custom-select-dropdown"
                    style="position: absolute; z-index: 99999; top: 100%; left: 0; margin-top: 2px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
                    role="listbox"
                >
                    <ul style="list-style: none; padding: 0; margin: 0; max-height: 200px; overflow-y: auto;">
                        {#each filteredOptions as option, index (option.id)}
                            {@const isSelected = selectedIndex === index}
                            {@const isMatch = text.trim() && option.label.toLowerCase().startsWith(text.toLowerCase().trim())}
                            <li
                                data-item-index={index}
                                role="option"
                                aria-selected={isSelected ? 'true' : 'false'}
                                class="custom-select-item {isSelected ? 'selected' : ''} {isMatch && hasSingleMatch ? 'matched' : ''}"
                                onmousedown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onclick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    selectReference(option);
                                }}
                                onkeydown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        selectReference(option);
                                    }
                                }}
                                tabindex="0"
                            >
                                <span class="prefix">{option.label}</span>
                                {#if isMatch && hasSingleMatch}
                                    <span class="match-indicator">✓</span>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                    {#if text.trim().length > 0}
                        <div class="custom-select-match-count {hasNoMatches ? 'no-match' : hasSingleMatch ? 'single-match' : 'multiple-match'}">
                            {#if hasNoMatches}
                                No matches
                            {:else}
                                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                            {/if}
                        </div>
                    {/if}
                </div>
            {:else if dropdownOpen && referenceOptions.length === 0}
                <div
                    bind:this={dropdownElement}
                    class="custom-select-dropdown"
                    style="position: absolute; z-index: 99999; top: 100%; left: 0; margin-top: 2px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
                    role="listbox"
                >
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li class="custom-select-item" style="color: #888; font-style: italic;">
                            No references available
                        </li>
                    </ul>
                </div>
            {/if}
        </div>
    {:else}
        <!-- Placeholder mode: Show placeholder -->
        <span
            class="custom-select-text cursor-pointer custom-select-placeholder"
            tabindex="0"
            role="textbox"
            onmousedown={onMouseDown}
            onkeydown={onSpanKeyDown}
            onfocusin={onSpanFocusIn}
        >
            {placeholderText}
        </span>
    {/if}
</span>
