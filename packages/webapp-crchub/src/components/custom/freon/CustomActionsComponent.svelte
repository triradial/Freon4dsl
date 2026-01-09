<script lang="ts">
    import { 
        ActionBox,
        isActionBox,
        type SelectOption, 
        type FreEditor,
        BoxFactory,
        FreLanguage,
        AST,
        BehaviorExecutionResult,
        FreCreatePartAction,
        isExternalBox,
        isPartReplacerBox,
        type Box,
        type FreNode
    } from "@freon4dsl/core";
    import { onMount, tick } from "svelte";
    import type { FreComponentProps } from "@freon4dsl/core-svelte";
    import { componentId, RenderComponent as RenderComponentRecursive } from "@freon4dsl/core-svelte";

    let { editor, box, isEditing = $bindable(false) }: FreComponentProps<any> & { isEditing?: boolean } = $props();
    
    // Get the actual ActionBox (created from PartReplacerBox when no value exists)
    let actionBox = $state<ActionBox | null>(null);
    
    // Track if we're handling a PartReplacerBox (content box with a value)
    let isPartReplacer = $derived(isPartReplacerBox(box));
    
    // Track a version number to force re-evaluation of property value
    let propertyValueVersion = $state(0);
    
    // Get current property value for PartReplacerBox
    // Note: For interface types, getPropertyValue() may return undefined even when a value exists
    // because it checks for exact type match (interface type vs implementing concept type).
    // So we always check the node property directly as the source of truth.
    let currentPropertyValue = $derived.by(() => {
        propertyValueVersion; // Make this reactive
        if (isPartReplacerBox(box) && box.propertyName) {
            // Always check the node property directly - this works for both exact types and interface types
            const directValue = box.node[box.propertyName];
            // Only return if it's a valid FreNode
            if (directValue && typeof directValue === 'object' && 'freLanguageConcept' in directValue) {
                return directValue;
            }
            // Fallback to getPropertyValue() if direct access doesn't work
            return box.getPropertyValue();
        }
        return null;
    });
    
    // Check if we should show the value (PartReplacerBox with value) or the list (no value or ActionBox)
    let hasValue = $derived(currentPropertyValue !== null && currentPropertyValue !== undefined);
    let shouldShowList = $derived(!hasValue || isEditing);
    
    // Get direct node value for PartReplacerBox (bypasses getPropertyValue which fails for interface types)
    // Force reactivity by depending on propertyValueVersion
    let directNodeValue = $derived.by(() => {
        propertyValueVersion; // Force reactivity
        if (isPartReplacerBox(box) && box.propertyName) {
            const value = box.node[box.propertyName];
            if (value && typeof value === 'object' && 'freLanguageConcept' in value) {
                console.log('🔵 CustomActionsComponent: directNodeValue derived', {
                    propertyName: box.propertyName,
                    valueType: value.freLanguageConcept(),
                    propertyValueVersion
                });
                return value;
            }
        }
        return null;
    });
    
    // Check if we have a direct value - this should be true after executeOption sets the value
    let hasDirectValue = $derived.by(() => {
        propertyValueVersion; // Force reactivity
        const has = directNodeValue !== null && directNodeValue !== undefined;
        if (isPartReplacerBox(box) && box.propertyName) {
            // Also check directly from node for immediate reactivity
            const nodeValue = box.node[box.propertyName];
            const nodeHasValue = nodeValue !== null && nodeValue !== undefined && typeof nodeValue === 'object' && 'freLanguageConcept' in nodeValue;
            const result = has || nodeHasValue;
            if (result) {
                console.log('🔵 CustomActionsComponent: hasDirectValue = true', {
                    propertyName: box.propertyName,
                    directNodeValue: directNodeValue?.freLanguageConcept?.(),
                    nodeValue: nodeValue?.freLanguageConcept?.(),
                    propertyValueVersion
                });
            }
            return result;
        }
        return has;
    });
    
    // svelte-ignore non_reactive_update
    let spanElement: HTMLSpanElement | null = null;
    // svelte-ignore non_reactive_update
    let inputElement: HTMLInputElement | null = null;
    // svelte-ignore non_reactive_update
    let widthSpan: HTMLSpanElement | null = null;
    // svelte-ignore non_reactive_update
    let dropdownElement: HTMLElement | null = null;
    // svelte-ignore non_reactive_update
    let componentWrapper: HTMLElement | null = null;
    
    const id = componentId(box);
    
    // Extract placeholder from box params if available
    let placeholderText = $derived(isExternalBox(box) ? (box.findParam("placeholder") || undefined) : undefined);
    
    // Initialize actionBox (create from PartReplacerBox when no value exists)
    $effect(() => {
        if (isActionBox(box)) {
            // Direct ActionBox - use it directly
            actionBox = box;
        } else if (isPartReplacerBox(box)) {
            // PartReplacerBox: Check if it has a value first
            const propertyName = box.propertyName;
            const node = box.node;
            const currentValue = box.getPropertyValue();
            
            // Check direct node value for interface types
            const directValue = node[propertyName];
            const hasDirect = directValue && typeof directValue === 'object' && 'freLanguageConcept' in directValue;
            console.log('🔵 CustomActionsComponent: PartReplacerBox detected', {
                propertyName,
                hasValue: currentValue !== null && currentValue !== undefined,
                value: currentValue,
                hasDirectValue: hasDirect,
                directValue: directValue?.freLanguageConcept?.()
            });
            
            // If PartReplacerBox already has a value, we should show it (not create ActionBox)
            // The component will handle this via hasValue check in the template
            if (currentValue !== null && currentValue !== undefined) {
                // Has value - don't create ActionBox, let the view mode show the value
                actionBox = null;
                return; // Exit early - the value will be shown in view mode
            }
            
            // No value - create ActionBox to show the list
            // Get property type from language definition
            const lang = FreLanguage.getInstance();
            const nodeConcept = node.freLanguageConcept();
            const propInfo = lang.classifierProperty(nodeConcept, propertyName);
            const propType = propInfo?.type;
            
            if (propType) {
                // Check if it's an interface - if so, we need to handle it specially
                // because ActionBox.getOptions() might not work until language is regenerated
                const interfaceInfo = lang.interface(propType);
                
                if (interfaceInfo) {
                    // It's an interface - create ActionBox but we'll override getOptions if needed
                    actionBox = BoxFactory.action(
                        node,
                        `${propertyName}-custom-action`,
                        box.findParam("placeholder") || `+ ${propertyName}`,
                        {
                            conceptName: propType,
                            propertyName: propertyName
                        }
                    );
                    
                    // Override getOptions to use hardcoded mapping if FreLanguage.getImplementingConcepts() returns empty
                    const originalGetOptions = actionBox.getOptions.bind(actionBox);
                    actionBox.getOptions = (editor: FreEditor) => {
                        const originalOptions = originalGetOptions(editor);
                        
                        // If we got options, use them
                        if (originalOptions.length > 0) {
                            return originalOptions;
                        }
                        
                        // Otherwise, use hardcoded mapping (same as CustomSelectComponent)
                        const getImplementingConcepts = (interfaceType: string): string[] => {
                            const interfaceImplementors: Record<string, string[]> = {
                                "RepeatUnit": ["Daily", "Weekly", "Monthly", "Forever", "RepeatEvery"],
                                "RepeatExpression": ["RepeatCondition", "RepeatCount"]
                            };
                            return interfaceImplementors[interfaceType] || [];
                        };
                        
                        const implementingConceptNames = getImplementingConcepts(propType);
                        console.log(`🔵 CustomActionsComponent: Using hardcoded mapping for ${propType}:`, implementingConceptNames);
                        
                        const options: SelectOption[] = [];
                        for (const conceptName of implementingConceptNames) {
                            const conceptInfo = lang.concept(conceptName);
                            if (conceptInfo && !conceptInfo.isAbstract) {
                                options.push({
                                    id: conceptName,
                                    label: conceptInfo.trigger || conceptInfo.typeName,
                                    action: new FreCreatePartAction({
                                        propertyName: propertyName,
                                        conceptName: conceptName
                                    }),
                                    description: `Create new ${conceptInfo.typeName}`
                                });
                            }
                        }
                        
                        return options;
                    };
                } else {
                    // Regular concept - create ActionBox normally
                    actionBox = BoxFactory.action(
                        node,
                        `${propertyName}-custom-action`,
                        box.findParam("placeholder") || `+ ${propertyName}`,
                        {
                            conceptName: propType,
                            propertyName: propertyName
                        }
                    );
                }
            } else {
                console.error(`CustomActionsComponent: Could not get property type for ${propertyName}`);
                actionBox = null;
            }
        } else {
            // This component should only be used for ActionBox or PartReplacerBox
            console.warn("CustomActionsComponent: Expected ActionBox or PartReplacerBox but got", box?.kind || typeof box);
            actionBox = null;
        }
    });
    
    // Get all options from the ActionBox
    let allOptions = $derived(
        actionBox ? actionBox.getOptions(editor) : []
    );
    
    // Debug logging
    $effect(() => {
        if (actionBox) {
            const opts = actionBox.getOptions(editor);
            console.log('🔵 CustomActionsComponent: allOptions', { 
                count: opts.length, 
                options: opts.map(o => ({ id: o.id, label: o.label })),
                propertyName: actionBox.propertyName,
                conceptName: actionBox.conceptName,
                boxKind: box?.kind
            });
        }
    });
    
    // Convert SelectOption[] to Listbox format (label and value)
    let listboxData = $derived(
        allOptions.map((opt) => ({
            label: opt.label,
            value: opt.id,
            option: opt, // Keep reference to original SelectOption
        }))
    );
    
    // Debug logging for listboxData
    $effect(() => {
        console.log('🔵 CustomActionsComponent: listboxData', { 
            count: listboxData.length, 
            data: listboxData 
        });
    });
    
    // Text state for input
    let text = $state('');
    
    // Track if dropdown is open
    let dropdownOpen = $state(false);
    
    // Always show all items, but track which ones match from the start
    let matchingItems = $derived(listboxData); // Always return all items
    
    // Calculate which items match from the start (case-insensitive)
    // Extract the prefix (before colon) for matching, or use full label if no colon
    let matchingItemIndices = $derived.by(() => {
        if (!text.trim()) {
            return new Set<number>(); // No matches when no text
        }
        const searchText = text.toLowerCase().trim();
        const matches = new Set<number>();
        listboxData.forEach((item, index) => {
            // Extract the prefix part (before colon) for matching
            const labelParts = item.label.split(':');
            const prefix = labelParts[0].trim().toLowerCase();
            // Match against the prefix only (the part before the colon) - must start with searchText
            if (prefix.startsWith(searchText)) {
                matches.add(index);
            }
        });
        return matches;
    });
    
    // Match count (items that start with the text)
    let matchCount = $derived(matchingItemIndices.size);
    
    // Check match count for indicator color
    let hasSingleMatch = $derived(matchCount === 1 && text.trim().length > 0);
    let hasZeroMatches = $derived(matchCount === 0 && text.trim().length > 0);
    let hasMultipleMatches = $derived(matchCount > 1 && text.trim().length > 0);
    
    // Get indicator color based on match count
    let indicatorColor = $derived.by(() => {
        if (hasZeroMatches) return 'no-match'; 
        if (hasSingleMatch) return 'single-match'; 
        if (hasMultipleMatches) return 'multiple-match';
        return 'transparent'; // No indicator when no text
    });
    
    // Handle input change - update text and show dropdown
    function onInputChange(e: Event) {
        const newText = (e.target as HTMLInputElement).value;
        text = newText;
        dropdownOpen = true;
        
        // Update input width
        tick().then(() => {
            setInputWidth();
        });
    }
    
    // Handle selection from listbox item
    function selectItem(item: typeof listboxData[0]) {
        console.log('🔵 CustomActionsComponent: selectItem called', { 
            item: item?.label, 
            hasBox: !!actionBox, 
            itemOption: !!item?.option,
            boxKind: box?.kind,
            isPartReplacerBox: isPartReplacerBox(box)
        });
        if (item && item.option) {
            // Use the ActionBox to execute the option - it has the correct node and property info
            // The action (FreCreatePartAction) will set box.node[propertyName] = newElement
            if (actionBox) {
                // Use executeOption which will call the action's execute method
                // This will create the part and set it on the property
                const result = actionBox.executeOption(editor, item.option);
                console.log('🔵 CustomActionsComponent: executeOption result', result);
                
                // After executing, the property should now have a value
                // Exit edit mode first so the component can switch to view mode
                dropdownOpen = false;
                endEditing();
                
                // Force a refresh to update the display - the component should detect hasValue and show the concept
                if (isPartReplacerBox(box)) {
                    // Wait for the action to complete, then refresh
                    tick().then(() => {
                        // Check if the property now has a value
                        // Note: getPropertyValue() might return undefined for interface types,
                        // so we check the node property directly
                        const propertyName = box.propertyName;
                        const nodeValue = box.node[propertyName];
                        console.log('🔵 CustomActionsComponent: After executeOption', {
                            propertyName,
                            nodeValue,
                            nodeValueType: nodeValue?.freLanguageConcept(),
                            getPropertyValue: box.getPropertyValue(),
                            propertyType: box.getPropertyType?.()
                        });
                        
                        // Force reactive update by incrementing version FIRST
                        propertyValueVersion++;
                        console.log('🔵 CustomActionsComponent: Incremented propertyValueVersion to:', propertyValueVersion);
                        
                        // Force refresh the editor projection FIRST to populate box.children
                        if (editor?.projection) {
                            console.log('🔵 CustomActionsComponent: Calling editor.projection.update()');
                            editor.projection.update();
                        }
                        
                        // Then wait another tick for box.children to be populated
                        return tick();
                    }).then(() => {
                        // Force another reactive update after projection is updated
                        propertyValueVersion++;
                        console.log('🔵 CustomActionsComponent: Second propertyValueVersion increment to:', propertyValueVersion);
                        
                        // Force refresh the component to show the new value
                        if (box && box.refreshComponent) {
                            console.log('🔵 CustomActionsComponent: Calling box.refreshComponent()');
                            box.refreshComponent();
                        }
                        // Final projection update
                        if (editor?.projection) {
                            editor.projection.update();
                        }
                    });
                }
            } else if (item.option.action) {
                // Fallback: execute action directly if we don't have a box
                // Use the original box (PartReplacerBox) so the action sets the value on the correct node
                const result = item.option.action.execute(box, item.option.label, editor);
                console.log('🔵 CustomActionsComponent: action.execute result', result);
                
                dropdownOpen = false;
                endEditing();
                
                // Force refresh
                tick().then(() => {
                    const newValue = box.getPropertyValue();
                    console.log('🔵 CustomActionsComponent: After action.execute, property value:', newValue);
                    
                    // Force reactive update by incrementing version
                    propertyValueVersion++;
                    
                    if (box && box.refreshComponent) {
                        box.refreshComponent();
                    }
                    if (editor && editor.projection) {
                        editor.projection.update();
                    }
                });
            } else {
                console.error('🔵 CustomActionsComponent: No box or action available to execute');
                dropdownOpen = false;
                endEditing();
            }
        } else {
            console.error('🔵 CustomActionsComponent: selectItem failed', { item: !!item, hasOption: !!item?.option });
        }
    }
    
    // Track selected index for arrow key navigation
    let selectedIndex = $state(-1);
    
    // Handle typing full name - check if it matches exactly, or if there's only one match from start
    function checkExactMatch() {
        if (!actionBox) return;
        
        // If text is empty, just exit
        if (!text.trim()) {
            dropdownOpen = false;
            return;
        }
        
        const searchText = text.trim().toLowerCase();
        
        // First check for exact match
        const exactMatch = listboxData.find(item => 
            item.label.toLowerCase() === searchText
        );
        
        if (exactMatch && exactMatch.option) {
            selectItem(exactMatch);
            return;
        }
        
        // If no exact match, check if there's exactly one match from start (auto-select on tab out)
        if (hasSingleMatch && matchCount === 1) {
            const matchingIndex = Array.from(matchingItemIndices)[0];
            const singleMatch = listboxData[matchingIndex];
            if (singleMatch && singleMatch.option) {
                selectItem(singleMatch);
            } else {
                dropdownOpen = false;
                endEditing();
            }
        } else {
            // No single match - just exit
            dropdownOpen = false;
            endEditing();
        }
    }
    
    // Start editing - show input and dropdown
    async function startEditing() {
        isEditing = true;
        dropdownOpen = true;
        await tick();
        if (inputElement) {
            inputElement.focus();
            inputElement.select();
            setInputWidth();
        }
    }
    
    // End editing - hide input and dropdown
    function endEditing() {
        isEditing = false;
        dropdownOpen = false;
        text = '';
    }
    
    // Set focus function
    async function setFocus() {
        if (isEditing && inputElement) {
            inputElement.focus();
            inputElement.select();
        } else {
            await startEditing();
        }
    }
    
    // Refresh function
    const refresh = (why?: string): void => {
        text = '';
    };
    
    // Handle click on span to start editing or remove value
    function onMouseDown(event: MouseEvent) {
        if (event.button === 0) { // left click
            event.preventDefault();
            event.stopPropagation();
            
            // If we have a value and it's a PartReplacerBox, allow removing it
            if (hasValue && isPartReplacerBox(box)) {
                // Remove the value to go back to the list
                AST.changeNamed(`CustomActionsComponent: Remove ${box.propertyName}`, () => {
                    box.setPropertyValue(null);
                });
                // Then show the list
                startEditing();
            } else {
                // No value - just show the list
                startEditing();
            }
        }
    }
    
    // Handle keyboard on span
    function onSpanKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            startEditing();
        }
    }
    
    // Handle focus on span
    function onSpanFocusIn() {
        startEditing();
    }
    
    // Handle keydown on input
    function onKeyDown(event: KeyboardEvent) {
        // Allow Tab to leave (will end editing via onFocusOut)
        if (event.key === 'Tab') {
            checkExactMatch();
            return;
        }
        
        // Handle Escape
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            endEditing();
            return;
        }
        
        // Handle Enter - treat like Tab (exit editing)
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            checkExactMatch();
            return;
        }
        
        // Handle Arrow keys - navigate through options
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
            
            if (!dropdownOpen) {
                dropdownOpen = true;
            }
            
            if (matchingItems.length === 0) {
                return;
            }
            
            if (event.key === 'ArrowDown') {
                selectedIndex = (selectedIndex + 1) % matchingItems.length;
            } else {
                selectedIndex = selectedIndex <= 0 ? matchingItems.length - 1 : selectedIndex - 1;
            }
            
            // Scroll into view
            tick().then(() => {
                const itemElement = document.querySelector(`[data-item-index="${selectedIndex}"]`) as HTMLElement;
                if (itemElement) {
                    itemElement.scrollIntoView({ block: 'nearest' });
                }
            });
            
            return;
        }
        
        // Allow navigation and editing keys
        if (
            event.key === "Backspace" ||
            event.key === "Delete" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "Home" ||
            event.key === "End" ||
            (event.ctrlKey && (event.key === "a" || event.key === "c" || event.key === "v" || event.key === "x"))
        ) {
            event.stopPropagation();
            return;
        }
        
        // Block other keys that would interfere
        if (event.key.length === 1 || event.key.startsWith('Arrow')) {
            event.stopPropagation();
        }
    }
    
    // Handle blur - only exit if focus leaves the entire component
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
            checkExactMatch();
            endEditing();
        }, 100);
    }
    
    // Handle click outside to close dropdown
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (isEditing) {
            if (dropdownElement && dropdownElement.contains(target)) {
                const rect = dropdownElement.getBoundingClientRect();
                const clickX = event.clientX;
                if (clickX > rect.right - 20) {
                    return;
                }
            }
            
            if (
                componentWrapper &&
                !componentWrapper.contains(target) &&
                !(inputElement && inputElement.contains(target)) &&
                !(dropdownElement && dropdownElement.contains(target))
            ) {
                checkExactMatch();
                endEditing();
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
    
    // Set input width to match content
    function setInputWidth() {
        if (widthSpan && inputElement) {
            let displayValue = inputElement.value || text;
            if (!displayValue || displayValue.length === 0) {
                displayValue = placeholderText || actionBox?.placeholder || "Search...";
                if (displayValue.length === 0) {
                    displayValue = " ";
                }
            }
            widthSpan.textContent = displayValue;
            const newWidth = Math.max(widthSpan.offsetWidth, 2 * 8); // Minimum 2ch
            inputElement.style.width = `${newWidth}px`;
        }
    }
    
    // Update input width when text changes
    $effect(() => {
        if (isEditing) {
            tick().then(() => {
                setInputWidth();
            });
        }
    });
    
    onMount(() => {
        if (box) {
            box.setFocus = setFocus;
            box.refreshComponent = refresh;
        }
        refresh();
    });
    
    $effect(() => {
        if (box) {
            box.setFocus = setFocus;
            box.refreshComponent = refresh;
        }
    });
</script>

{#if actionBox || (isPartReplacerBox(box) && (hasDirectValue || (hasValue && currentPropertyValue)))}
    {@const checkDirectValue = isPartReplacerBox(box) && box.propertyName ? (box.node[box.propertyName] && typeof box.node[box.propertyName] === 'object' && 'freLanguageConcept' in box.node[box.propertyName] ? box.node[box.propertyName] : null) : null}
    {@const hasDirectValueInTemplate = checkDirectValue !== null && checkDirectValue !== undefined}
    {@const shouldShowValue = hasDirectValueInTemplate || hasDirectValue || (hasValue && currentPropertyValue)}
    {@const nodeValueToUse = checkDirectValue || directNodeValue || currentPropertyValue}
    {(() => {
        if (isPartReplacerBox(box)) {
            console.log('🔵 CustomActionsComponent: Template rendering decision', {
                propertyName: box.propertyName,
                hasDirectValueInTemplate,
                hasDirectValue,
                hasValue,
                currentPropertyValue: currentPropertyValue?.freLanguageConcept?.(),
                shouldShowValue,
                boxChildren: box.children?.length || 0,
                checkDirectValue: checkDirectValue?.freLanguageConcept?.()
            });
        }
        return '';
    })()}
    <span
        bind:this={componentWrapper}
        class="custom-interface-action-component {box?.cssClass || ''}"
        role="none"
        {id}
    >
        {#if shouldShowValue}
            <!-- View mode: Show value if exists -->
            <!-- According to Freon docs, when replace= is used, the external component replaces the entire property projection -->
            <!-- When a value exists, we need to render it. Try multiple approaches: -->
            {(() => {
                if (isPartReplacerBox(box) && nodeValueToUse) {
                    console.log('🔵 CustomActionsComponent: Rendering value path', {
                        propertyName: box.propertyName,
                        nodeValueType: nodeValueToUse?.freLanguageConcept?.(),
                        boxChildren: box.children?.length || 0,
                        hasProjection: !!editor?.projection,
                        editor: editor ? 'exists' : 'null'
                    });
                }
                return '';
            })()}
            {#if isPartReplacerBox(box) && box.children && box.children.length > 0}
                <!-- First: Render children if they exist (Freon's default behavior) -->
                {#each box.children as childBox}
                    <RenderComponentRecursive box={childBox} {editor} />
                {/each}
            {:else if nodeValueToUse && editor?.projection}
                <!-- Second: Get box from projection using the node value -->
                {@const propBox = editor.projection.getBox(nodeValueToUse)}
                {(() => {
                    console.log('🔵 CustomActionsComponent: projection.getBox result', {
                        nodeValueType: nodeValueToUse?.freLanguageConcept?.(),
                        propBox: propBox ? 'found' : 'null',
                        propBoxKind: propBox?.kind
                    });
                    return '';
                })()}
                {#if propBox}
                    <RenderComponentRecursive box={propBox} {editor} />
                {:else}
                    <!-- Third: Try to get box using getBoxProvider -->
                    {@const boxProvider = editor.projection.getBoxProvider(nodeValueToUse)}
                    {(() => {
                        console.log('🔵 CustomActionsComponent: getBoxProvider result', {
                            nodeValueType: nodeValueToUse?.freLanguageConcept?.(),
                            boxProvider: boxProvider ? 'found' : 'null',
                            providerBox: boxProvider?.box ? 'found' : 'null'
                        });
                        return '';
                    })()}
                    {#if boxProvider && boxProvider.box}
                        <RenderComponentRecursive box={boxProvider.box} {editor} />
                    {:else}
                        <!-- Last resort: show concept name -->
                        {(() => {
                            console.log('🔵 CustomActionsComponent: Falling back to concept name', {
                                nodeValueType: nodeValueToUse?.freLanguageConcept?.()
                            });
                            return '';
                        })()}
                        <span
                            bind:this={spanElement}
                            class="custom-select-text cursor-pointer"
                            tabindex="0"
                            role="textbox"
                            onmousedown={onMouseDown}
                            onkeydown={onSpanKeyDown}
                            onfocusin={onSpanFocusIn}
                            title="Click to change or remove"
                        >
                            {nodeValueToUse?.freLanguageConcept?.() || 'Unknown'}
                        </span>
                    {/if}
                {/if}
            {:else if nodeValueToUse}
                <!-- No projectionHandler: show concept name -->
                <span
                    bind:this={spanElement}
                    class="custom-select-text cursor-pointer"
                    tabindex="0"
                    role="textbox"
                    onmousedown={onMouseDown}
                    onkeydown={onSpanKeyDown}
                    onfocusin={onSpanFocusIn}
                    title="Click to change or remove"
                >
                    {nodeValueToUse.freLanguageConcept()}
                </span>
            {/if}
        {:else if isEditing}
            <!-- Edit mode: Show input with Listbox -->
            <div class="text-dropdown-component-text-wrapper" style="position: relative; display: inline-block;">
                <!-- Hidden span to measure text width -->
                <span
                    bind:this={widthSpan}
                    style="visibility: hidden; position: absolute; white-space: pre; font-family: var(--font-family-sans); font-size: var(--standard-font-size); padding: 0.15rem 0.25rem 0 0.3rem;"
                >
                    {text || placeholderText || actionBox?.placeholder || "item"}
                </span>
                <input
                    bind:this={inputElement}
                    type="text"
                    bind:value={text}
                    placeholder={placeholderText || actionBox?.placeholder || "item"}
                    oninput={onInputChange}
                    onkeydown={onKeyDown}
                    onfocusout={onFocusOut}
                    class="custom-select-input"
                    style="min-width: 2ch;"
                    autocomplete="off"
                />
                {#if dropdownOpen && listboxData.length > 0}
                  <div 
                      bind:this={dropdownElement}
                      class="custom-select-dropdown"
                      style="position: absolute; z-index: 99999; top: 100%; left: 0; margin-top: 2px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
                      role="listbox">
                        <ul style="list-style: none; padding: 0; margin: 0; max-height: 200px; overflow-y: auto;">
                            {#each matchingItems as item, index (item.value + '-' + index)}
                                {@const isMatch = matchingItemIndices.has(index)}
                                {@const isHighlighted = isMatch && text.trim().length > 0}
                                {@const isSelected = selectedIndex === index}
                                {@const matchClass = isHighlighted ? (hasSingleMatch ? 'matched' : hasMultipleMatches ? 'matched-multiple' : '') : ''}
                                <li
                                    data-item-index={index}
                                    role="option"
                                    aria-selected={isHighlighted || isSelected ? 'true' : 'false'}
                                    class="custom-select-item {matchClass} {isSelected ? 'selected' : ''}"
                                    onmousedown={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'LI' || target.closest('li') === e.currentTarget) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }
                                    }}
                                    onclick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'LI' || target.closest('li') === e.currentTarget) {
                                            console.log('🔵 CustomActionsComponent: item clicked', { itemLabel: item.label, index });
                                            e.preventDefault();
                                            e.stopPropagation();
                                            selectItem(item);
                                        }
                                    }}
                                    onkeydown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            selectItem(item);
                                        }
                                    }}
                                    tabindex="0"
                                >
                                    <span>{item.label}</span>
                                    {#if isHighlighted}
                                        <span class="match-indicator">✓</span>
                                    {/if}
                                </li>
                            {/each}
                        </ul>
                        <!-- Match count indicator -->
                        {#if text.trim().length > 0}
                            <div class="custom-select-match-count {indicatorColor}">
                                {#if matchCount === 0}
                                    No matches
                                {:else}
                                    {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                                {/if}
                            </div>
                        {/if}
                  </div>
                {/if}
            </div>
        {:else}
            <!-- Show placeholder - clicking it shows the list -->
            <span
                bind:this={spanElement}
                class="custom-select-text cursor-pointer custom-select-placeholder"
                tabindex="0"
                role="textbox"
                onmousedown={onMouseDown}
                onkeydown={onSpanKeyDown}
                onfocusin={onSpanFocusIn}
            >
                {placeholderText || actionBox?.placeholder || "item"}
            </span>
        {/if}
    </span>
{:else}
    <div class="custom-select-error" style="padding: 4px; background: #fee; border: 1px solid #fcc; color: #c00; border-radius: 4px; display: inline-block;">
        [CustomActionsComponent: {box?.kind || 'unknown'}]
    </div>
{/if}

