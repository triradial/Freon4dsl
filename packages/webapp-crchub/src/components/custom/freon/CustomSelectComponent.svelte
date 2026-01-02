<script lang="ts">
    import { 
        SelectBox, 
        isSelectBox, 
        type SelectOption, 
        type FreEditor,
        PartReplacerBox,
        isPartReplacerBox,
        RefReplacerBox,
        isRefReplacerBox,
        BoxFactory,
        FreLanguage,
        FreLanguageEnvironment,
        AST,
        BehaviorExecutionResult,
        isExternalBox,
        FreNodeReference
    } from "@freon4dsl/core";
    import { onMount, tick } from "svelte";
    import type { FreComponentProps } from "@freon4dsl/core-svelte";
    import { componentId } from "@freon4dsl/core-svelte";

    let { editor, box, isEditing = $bindable(false) }: FreComponentProps<any> & { isEditing?: boolean } = $props();
    
    // Get the actual SelectBox - either directly or create it from PartReplacerBox/RefReplacerBox
    let selectBox = $state<SelectBox | null>(null);
    
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
    
    // Get all options from the SelectBox
    let allOptions = $derived(selectBox ? selectBox.getOptions(editor) : []);
    
    // Debug logging
    $effect(() => {
        if (selectBox) {
            const opts = selectBox.getOptions(editor);
            console.log('🔵 CustomSelectComponent: allOptions', { 
                count: opts.length, 
                options: opts,
                propertyName: selectBox.propertyName,
                boxKind: box?.kind,
                isSelectBox: isSelectBox(box),
                isRefReplacerBox: isRefReplacerBox(box),
                isPartReplacerBox: isPartReplacerBox(box)
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
        console.log('🔵 CustomSelectComponent: listboxData', { 
            count: listboxData.length, 
            data: listboxData 
        });
    });
    
    // Note: Removed useListCollection - using custom HTML listbox instead
    
    // Get currently selected option - force reactive updates
    let selectionVersion = $state(0);
    let selectedOption = $derived.by(() => {
        selectionVersion; // Make this reactive
        return selectBox ? selectBox.getSelectedOption() : null;
    });
    
    // Display text for non-editing mode
    let displayText = $derived(selectedOption?.label || '');
    
    // Debug logging for selectedOption
    $effect(() => {
        console.log('🔵 CustomSelectComponent: selectedOption changed', { 
            selectedOption: selectedOption?.label,
            displayText 
        });
    });
    
    // Text state for input
    let text = $state('');
    
    // Update text when selection changes
    $effect(() => {
        if (selectedOption) {
            text = selectedOption.label;
        } else {
            text = '';
        }
    });
    
    // Initialize selectBox
    $effect(() => {
        if (isSelectBox(box)) {
            // TextDropdownComponent just uses box.getOptions(editor) directly - the box already has the correct getOptions function
            // So we should use the existing SelectBox as-is, just like TextDropdownComponent does
            selectBox = box;
        } else if (isPartReplacerBox(box) || isRefReplacerBox(box)) {
            const propertyName = box.propertyName;
            const node = box.node;
            
            // Get property type from language definition (box.propertyType may not be available)
            const lang = FreLanguage.getInstance();
            const nodeConcept = node.freLanguageConcept();
            const propInfo = lang.classifierProperty(nodeConcept, propertyName);
            const propType = propInfo?.type;
            
            console.log(`🔵 CustomSelectComponent: RefReplacerBox/PartReplacerBox check for ${propertyName}`, { propType, boxKind: box.kind, nodeConcept });
            
            // Get current value
            const currentValueRaw = node[propertyName];
            const currentValue = isRefReplacerBox(box) 
                ? (currentValueRaw as FreNodeReference<any>)?.referred
                : currentValueRaw;
            
            // Check if it's a limited concept
            const concept = propType ? lang.concept(propType) : null;
            const isLimited = concept && concept.isLimited;
            
            console.log(`🔵 CustomSelectComponent: Limited check for ${propertyName} (RefReplacerBox)`, { propType, concept: !!concept, isLimited, instanceNames: isLimited ? concept.instanceNames : null });
            
            if (isLimited && concept) {
                // Limited concept - use instance names
                // For now, use instance names as labels since we can't easily access the runtime class
                // The display names should come from the instance objects, but we'll use the raw names for now
                const instanceNames = concept.instanceNames || [];
                
                // Try to get a sample instance from the current value to see the structure
                const currentValueRaw = node[propertyName];
                const currentValue = isRefReplacerBox(box) 
                    ? (currentValueRaw as FreNodeReference<any>)?.referred
                    : currentValueRaw;
                
                // If we have a current value, use its name as a hint for the label format
                let sampleName: string | undefined = undefined;
                if (currentValue && (currentValue as any).name) {
                    sampleName = (currentValue as any).name;
                }
                
                // Use the same approach as UtilLimitedHelpers.limitedSelectBox
                // It uses scoper.getVisibleNodes() to get the instance objects, then maps node.name to label
                const scoper = FreLanguageEnvironment.getInstance().scoper;
                
                selectBox = BoxFactory.select(
                    node,
                    `${propertyName}-custom-select`,
                    placeholderText || `+ ${propertyName}`,
                    () => {
                        if (scoper) {
                            // Use the same approach as UtilLimitedHelpers.limitedSelectBox
                            // It expects scoper.getVisibleNodes() to return the instance objects with .name properties
                            const visibleNodes = scoper.getVisibleNodes(node, propType);
                            const options = visibleNodes
                                .filter((node) => !!node.name && node.name !== "")
                                .map((node) => ({
                                    id: node.name,
                                    label: node.name
                                }));
                            console.log(`🔵 CustomSelectComponent: getOptions for limited ${propertyName} (RefReplacerBox) using scoper.getVisibleNodes`, { count: options.length, visibleNodesCount: visibleNodes.length, options, instanceNames });
                            return options;
                        } else {
                            // Fallback to instance names if scoper is not available
                            const options = instanceNames.map((instanceName: string) => {
                                return {
                                    id: instanceName,
                                    label: instanceName
                                };
                            });
                            console.log(`🔵 CustomSelectComponent: getOptions for limited ${propertyName} (RefReplacerBox) fallback to instanceNames`, { count: options.length, instanceNames, options });
                            return options;
                        }
                    },
                    () => {
                        // Read current value from node each time (not captured)
                        // Use the same approach as UtilLimitedHelpers.limitedSelectBox - just check property.name
                        const property = node[propertyName];
                        if (property) {
                            const currentValue = isRefReplacerBox(box) 
                                ? (property as FreNodeReference<any>)?.referred
                                : property;
                            
                            if (currentValue && currentValue.name) {
                                // Since options use node.name as both id and label, return it directly
                                const valueName = currentValue.name;
                                return { id: valueName, label: valueName };
                            }
                        }
                        return null;
                    },
                    (editor: FreEditor, option: SelectOption): BehaviorExecutionResult => {
                        if (option && scoper) {
                            // Find the actual instance node object by matching the display name
                            const visibleNodes = scoper.getVisibleNodes(node, propType);
                            const matchingNode = visibleNodes.find((n) => n.name === option.label);
                            
                            if (matchingNode) {
                                AST.changeNamed(`CustomSelectComponent: Set ${propertyName} to ${option.label}`, () => {
                                    // Create a reference to the actual instance node object
                                    const ref = FreNodeReference.create(matchingNode, propType);
                                    box.setPropertyValue(ref);
                                });
                            } else {
                                console.error(`CustomSelectComponent: Could not find instance node for ${option.label}`);
                            }
                        } else {
                            AST.changeNamed(`CustomSelectComponent: Set ${propertyName} to null`, () => {
                                box.setPropertyValue(null);
                            });
                        }
                        return BehaviorExecutionResult.EXECUTED;
                    },
                    {}
                );
                selectBox.propertyName = propertyName;
            } else {
                // Non-limited concept - use scoper
                const scoper = FreLanguageEnvironment.getInstance().scoper;
                
                if (!scoper) {
                    console.error(`CustomSelectComponent: Scoper is not available for ${propertyName}`);
                    selectBox = null;
                    return;
                }
                
                // Check if propType is an interface
                const lang = FreLanguage.getInstance();
                const interfaceInfo = lang.interface(propType);
                let implementingConceptNames: string[] = [];
                if (interfaceInfo && propType === "RepeatExpression") {
                    implementingConceptNames = ["RepeatCondition", "RepeatCount"];
                }
                
                selectBox = BoxFactory.select(
                    node,
                    `${propertyName}-custom-select`,
                    placeholderText || `+ ${propertyName}`,
                    () => {
                        let visibleNodes: any[] = [];
                        
                        if (implementingConceptNames.length > 0) {
                            for (const conceptName of implementingConceptNames) {
                                const nodes = scoper.getVisibleNodes(node, conceptName);
                                visibleNodes = visibleNodes.concat(nodes);
                            }
                        } else {
                            visibleNodes = scoper.getVisibleNodes(node, propType);
                        }
                        
                        return visibleNodes
                            .filter((node) => !!node.name && node.name !== "")
                            .map((node) => ({
                                id: node.name,
                                label: node.name
                            }));
                    },
                    () => {
                        if (currentValue && currentValue.name) {
                            return { id: currentValue.name, label: currentValue.name };
                        }
                        if (isRefReplacerBox(box) && currentValueRaw) {
                            const ref = currentValueRaw as FreNodeReference<any>;
                            const refName = ref.name || ref.referred?.name;
                            if (refName) {
                                return { id: refName, label: refName };
                            }
                        }
                        return null;
                    },
                    (editor: FreEditor, option: SelectOption): BehaviorExecutionResult => {
                        if (option) {
                            const visibleNodes = scoper.getVisibleNodes(node, propType);
                            const selectedNode = visibleNodes.find((n) => n.name === option.label);
                            if (selectedNode) {
                                AST.changeNamed(`CustomSelectComponent: Set ${propertyName} to ${option.label}`, () => {
                                    if (isRefReplacerBox(box)) {
                                        const ref = FreNodeReference.create(selectedNode, propType);
                                        box.setPropertyValue(ref);
                                    } else {
                                        box.setPropertyValue(selectedNode);
                                    }
                                });
                            }
                        } else {
                            AST.changeNamed(`CustomSelectComponent: Set ${propertyName} to null`, () => {
                                box.setPropertyValue(null);
                            });
                        }
                        return BehaviorExecutionResult.EXECUTED;
                    },
                    {}
                );
                selectBox.propertyName = propertyName;
            }
        } else {
            console.error("CustomSelectComponent: Expected SelectBox, PartReplacerBox, or RefReplacerBox but got", box?.kind || typeof box);
            selectBox = null;
        }
    });
    
    // Track if dropdown is open
    let dropdownOpen = $state(false);
    
    // Calculate matches based on text input (case-insensitive)
    let matchingItems = $derived.by(() => {
        if (!text.trim()) {
            return listboxData; // Show all if no text
        }
        const searchText = text.toLowerCase();
        return listboxData.filter(item => 
            item.label.toLowerCase().includes(searchText)
        );
    });
    
    // Match count
    let matchCount = $derived(matchingItems.length);
    
    // Set of matching item values for highlighting
    let matchingItemValues = $derived(new Set(matchingItems.map(item => item.value)));
    
    // Check match count for indicator color
    let hasSingleMatch = $derived(matchCount === 1 && text.trim().length > 0);
    let hasZeroMatches = $derived(matchCount === 0 && text.trim().length > 0);
    let hasMultipleMatches = $derived(matchCount > 1 && text.trim().length > 0);
    
    // Removed auto-select effect - will handle in checkExactMatch/endEditing instead
    
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
        
        // Clear selected index when typing (no keyboard highlight during typing)
        selectedIndex = -1;
        
        // If current selection doesn't match the new text filter, clear it
        if (selectedOption && text.trim()) {
            const searchText = text.toLowerCase();
            const selectedItem = listboxData.find(item => item.value === selectedOption.id);
            if (selectedItem && !selectedItem.label.toLowerCase().includes(searchText)) {
                // Current selection doesn't match filter, clear it
                if (selectBox) {
                    if (isSelectBox(box)) {
                        selectBox.executeOption(editor, null);
                    } else if (box && (isPartReplacerBox(box) || isRefReplacerBox(box))) {
                        AST.changeNamed(`CustomSelectComponent: Clear ${box.propertyName} (no longer matches filter)`, () => {
                            box.setPropertyValue(null);
                        });
                    }
                    selectionVersion++;
                }
            }
        }
        
        // Update input width
        tick().then(() => {
            setInputWidth();
        });
    }
    
    // Update selectedIndex when selectedOption changes (for arrow key navigation)
    $effect(() => {
        if (selectedOption && listboxData.length > 0) {
            const index = listboxData.findIndex(item => item.value === selectedOption.id);
            if (index >= 0) {
                selectedIndex = index;
            }
        } else {
            selectedIndex = -1;
        }
    });
    
    // Clear selection if it doesn't match current text filter
    $effect(() => {
        if (selectedOption && text.trim() && selectBox && listboxData.length > 0) {
            const searchText = text.toLowerCase();
            const selectedItem = listboxData.find(item => item.value === selectedOption.id);
            if (selectedItem && !selectedItem.label.toLowerCase().includes(searchText)) {
                // Current selection doesn't match filter, clear it
                if (isSelectBox(box)) {
                    selectBox.executeOption(editor, null);
                } else if (box && (isPartReplacerBox(box) || isRefReplacerBox(box))) {
                    AST.changeNamed(`CustomSelectComponent: Clear ${box.propertyName} (no longer matches filter)`, () => {
                        box.setPropertyValue(null);
                    });
                }
                selectionVersion++;
            }
        }
    });
    
    // Handle selection from listbox item
    function selectItem(item: typeof listboxData[0]) {
        console.log('🔵 CustomSelectComponent: selectItem called', { item: item?.label, hasSelectBox: !!selectBox, itemOption: item?.option });
        if (item && selectBox) {
            const result = selectBox.executeOption(editor, item.option);
            console.log('🔵 CustomSelectComponent: executeOption result', result);
            // Force reactive update
            selectionVersion++;
            text = item.label;
            dropdownOpen = false;
            endEditing();
            // Force refresh to update the display
            if (box && box.refreshComponent) {
                box.refreshComponent();
            }
            // Also trigger reactive update after a tick
            tick().then(() => {
                selectionVersion++; // Force another update
                if (box && box.refreshComponent) {
                    box.refreshComponent();
                }
            });
        } else {
            console.error('🔵 CustomSelectComponent: selectItem failed', { item: !!item, selectBox: !!selectBox });
        }
    }
    
    // Track selected index for arrow key navigation (same as actual selection)
    let selectedIndex = $state(-1);
    
    // Handle typing full name - check if it matches exactly, or if there's only one match
    function checkExactMatch() {
        if (!selectBox) return;
        
        // If text is empty, ensure selection is null and exit
        if (!text.trim()) {
            // Nothing entered - check if there's a current selection to clear
            const currentOption = selectBox.getSelectedOption();
            // Only clear if there's actually a selection
            if (currentOption) {
                if (isSelectBox(box)) {
                    selectBox.executeOption(editor, null);
                } else if (box && (isPartReplacerBox(box) || isRefReplacerBox(box))) {
                    AST.changeNamed(`CustomSelectComponent: Clear ${box.propertyName} on tab out (empty text)`, () => {
                        box.setPropertyValue(null);
                    });
                }
                selectionVersion++;
            }
            dropdownOpen = false;
            if (box && box.refreshComponent) {
                box.refreshComponent();
            }
            return;
        }
        
        // First check for exact match
        const exactMatch = listboxData.find(item => 
            item.label.toLowerCase() === text.trim().toLowerCase()
        );
        
        if (exactMatch) {
            selectBox.executeOption(editor, exactMatch.option);
            selectionVersion++;
            text = exactMatch.label;
            dropdownOpen = false;
            if (box && box.refreshComponent) {
                box.refreshComponent();
            }
            return;
        }
        
        // If no exact match, check if there's exactly one match (auto-select on tab out)
        if (hasSingleMatch && matchingItems.length === 1) {
            const singleMatch = matchingItems[0];
            selectBox.executeOption(editor, singleMatch.option);
            selectionVersion++;
            text = singleMatch.label;
            dropdownOpen = false;
            if (box && box.refreshComponent) {
                box.refreshComponent();
            }
        } else {
            // No single match (either 0 matches or multiple matches) - clear selection
            if (selectBox) {
                // For SelectBox, use executeOption with null
                if (isSelectBox(box)) {
                    selectBox.executeOption(editor, null);
                } else if (box && (isPartReplacerBox(box) || isRefReplacerBox(box))) {
                    AST.changeNamed(`CustomSelectComponent: Clear ${box.propertyName} on tab out (no single match)`, () => {
                        box.setPropertyValue(null);
                    });
                }
                selectionVersion++;
                text = '';
                dropdownOpen = false;
                if (box && box.refreshComponent) {
                    box.refreshComponent();
                }
            }
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
        // Reset text to selected value
        if (selectedOption) {
            text = selectedOption.label;
        } else {
            text = '';
        }
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
        // Update text from selected option
        if (selectedOption) {
            text = selectedOption.label;
        } else {
            text = '';
        }
    };
    
    // Handle click on span to start editing
    function onMouseDown(event: MouseEvent) {
        if (event.button === 0) { // left click
            event.preventDefault();
            event.stopPropagation();
            startEditing();
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
        // When span receives focus (e.g., from tabbing), switch to edit mode
        startEditing();
    }
    
    // Handle keydown on input
    function onKeyDown(event: KeyboardEvent) {
        // Allow Tab to leave (will end editing via onFocusOut)
        if (event.key === 'Tab') {
            checkExactMatch(); // Check for exact match before leaving
            // Don't call endEditing() here - let the browser move focus naturally,
            // and onFocusOut will handle ending editing
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
                checkExactMatch(); // Check for exact match before leaving
                endEditing(); // Exit editing mode (like Tab does)
                return;
            }
            
            // Handle Arrow keys - directly change selection
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                console.log('🔵 Arrow key pressed', { key: event.key, dropdownOpen, listboxDataLength: listboxData.length, text });
                event.preventDefault();
                event.stopPropagation();
                
                // Ensure dropdown is open
                if (!dropdownOpen) {
                    dropdownOpen = true;
                }
                
                // Always navigate through all items in the list
                if (listboxData.length === 0) {
                    console.log('🔵 Arrow keys: No items to navigate', { listboxData: listboxData.length, text });
                    return;
                }
                
                // Find the current selected index
                let currentIndex = selectedIndex >= 0 && selectedIndex < listboxData.length ? selectedIndex : -1;
                
                // Determine new index based on arrow direction and current state
                let newIndex = -1;
                const hasText = text.trim().length > 0;
                
                if (event.key === 'ArrowDown') {
                    // Down arrow
                    if (currentIndex < 0 || (hasMultipleMatches && hasText)) {
                        // Nothing selected OR multiple items match - go to first item
                        newIndex = 0;
                    } else {
                        // One item selected - move to next item, wrap around if at end
                        newIndex = (currentIndex + 1) % listboxData.length;
                    }
                } else {
                    // ArrowUp
                    if (currentIndex < 0 || (hasMultipleMatches && hasText)) {
                        // Nothing selected OR multiple items match - go to last item
                        newIndex = listboxData.length - 1;
                    } else {
                        // One item selected - move to previous item, wrap around if at start
                        newIndex = currentIndex - 1;
                        if (newIndex < 0) {
                            newIndex = listboxData.length - 1;
                        }
                    }
                }
                
                // Directly update selection (this will update selectedIndex via the effect)
                if (newIndex >= 0 && newIndex < listboxData.length) {
                    const selectedItem = listboxData[newIndex];
                    
                    if (selectBox && selectedItem) {
                        selectBox.executeOption(editor, selectedItem.option);
                        selectionVersion++;
                        text = selectedItem.label;
                        console.log('🔵 Arrow keys: Updated selection', { 
                            direction: event.key, 
                            newIndex, 
                            itemLabel: selectedItem.label,
                            listboxDataLength: listboxData.length,
                            currentIndex
                        });
                        
                        // Update input width to fit new text
                        tick().then(() => {
                            setInputWidth();
                        });
                    }
                    
                    // Scroll into view
                    tick().then(() => {
                        const itemElement = document.querySelector(`[data-item-index="${newIndex}"]`) as HTMLElement;
                        if (itemElement) {
                            itemElement.scrollIntoView({ block: 'nearest' });
                        }
                    });
                } else {
                    console.log('🔵 Arrow keys: Invalid newIndex', { newIndex, listboxDataLength: listboxData.length });
                }
                
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
        // Get the element that is receiving focus
        const relatedTarget = event.relatedTarget as HTMLElement;
        
        // Check if focus is moving to an element inside our component
        if (relatedTarget) {
            // Check if the new focus target is inside the input, dropdown, or component wrapper
            if (
                (inputElement && inputElement.contains(relatedTarget)) ||
                (dropdownElement && dropdownElement.contains(relatedTarget)) ||
                (componentWrapper && componentWrapper.contains(relatedTarget))
            ) {
                // Focus is staying within the component, don't exit edit mode
                return;
            }
        }
        
        // Focus is leaving the component, check for exact match and exit
        setTimeout(() => {
            // Double-check that focus is still outside the component
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement) {
                if (
                    (inputElement && inputElement.contains(activeElement)) ||
                    (dropdownElement && dropdownElement.contains(activeElement)) ||
                    (componentWrapper && componentWrapper.contains(activeElement))
                ) {
                    // Focus came back to the component, don't exit
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
            // Check if click is on scrollbar (scrollbar is part of the dropdown but might not be in contains check)
            if (dropdownElement && dropdownElement.contains(target)) {
                // Check if click is on scrollbar - if so, don't close
                const rect = dropdownElement.getBoundingClientRect();
                const clickX = event.clientX;
                const clickY = event.clientY;
                // If click is near the right edge (where scrollbar would be), allow it
                if (clickX > rect.right - 20) {
                    return; // Don't close on scrollbar click
                }
            }
            
            // Check if click is outside the entire component (input + dropdown)
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
                displayValue = placeholderText || selectBox?.placeholder || "Search...";
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

{#if selectBox}
    <span
        bind:this={componentWrapper}
        class="custom-select-component {box?.cssClass || ''}"
        role="none"
        {id}
    >
        {#if isEditing}
            <!-- Edit mode: Show input with Listbox -->
            <div class="text-dropdown-component-text-wrapper" style="position: relative; display: inline-block;">
                <!-- Hidden span to measure text width -->
                <span
                    bind:this={widthSpan}
                    style="visibility: hidden; position: absolute; white-space: pre; font-family: var(--font-family-sans); font-size: var(--standard-font-size); padding: 0.15rem 0.25rem 0 0.3rem;"
                >
                    {text || placeholderText || selectBox.placeholder || "item"}
                </span>
                <input
                    bind:this={inputElement}
                    type="text"
                    bind:value={text}
                    placeholder={placeholderText || selectBox.placeholder || "item"}
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
                            {#each listboxData as item, index (item.value + '-' + index)}
                                {@const isMatch = text.trim() === '' || item.label.toLowerCase().includes(text.toLowerCase())}
                                {@const isHighlighted = isMatch && text.trim().length > 0}
                                {@const isSelected = selectedOption && item.value === selectedOption.id && isMatch && !isHighlighted}
                                {@const matchClass = isHighlighted ? (hasSingleMatch ? 'matched' : hasMultipleMatches ? 'matched-multiple' : '') : ''}
                                <li
                                    data-item-index={index}
                                    role="option"
                                    aria-selected={isHighlighted || isSelected ? 'true' : 'false'}
                                    class="custom-select-item {matchClass} {isSelected ? 'selected' : ''}"
                                    onmousedown={(e) => {
                                        // Prevent input from losing focus when clicking dropdown items
                                        // But allow scrollbar clicks
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'LI' || target.closest('li') === e.currentTarget) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }
                                    }}
                                    onclick={(e) => {
                                        // Only handle clicks on the list item itself, not scrollbar
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'LI' || target.closest('li') === e.currentTarget) {
                                            console.log('🔵 CustomSelectComponent: item clicked', { itemLabel: item.label, index });
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
                                    onmouseenter={() => {
                                        // On mouse enter, update selection to match hover
                                        if (isMatch && selectBox) {
                                            selectBox.executeOption(editor, item.option);
                                            selectionVersion++;
                                            text = item.label;
                                            // Update input width to fit new text
                                            tick().then(() => {
                                                setInputWidth();
                                            });
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
                        {:else if !selectedOption && dropdownOpen}
                            <div class="custom-select-match-count no-match">
                                No matches
                            </div>
                        {/if}
                  </div>
                {/if}
            </div>
        {:else}
            <!-- View mode: Show span that looks like text -->
            <span
                bind:this={spanElement}
                class="custom-select-text cursor-pointer {!displayText ? 'custom-select-placeholder' : ''}"
                tabindex="0"
                role="textbox"
                onmousedown={onMouseDown}
                onkeydown={onSpanKeyDown}
                onfocusin={onSpanFocusIn}
            >
                {displayText || placeholderText || selectBox.placeholder || "item"}
            </span>
        {/if}
    </span>
{:else}
    <div class="custom-select-error" style="padding: 4px; background: #fee; border: 1px solid #fcc; color: #c00; border-radius: 4px; display: inline-block;">
        [CustomSelectComponent: {box?.kind || 'unknown'} - {(isPartReplacerBox(box) || isRefReplacerBox(box)) ? box.propertyName : 'N/A'}]
    </div>
{/if}
