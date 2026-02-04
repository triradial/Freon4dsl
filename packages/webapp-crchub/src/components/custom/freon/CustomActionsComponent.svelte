<script lang="ts">
    import {
        ActionBox,
        AST,
        BoxFactory,
        FreCreatePartAction,
        FreLanguage,
        isActionBox,
        isExternalBox,
        isPartReplacerBox,
        type FreEditor,
        type SelectOption
    } from "@freon4dsl/core";
    import type { FreComponentProps } from "@freon4dsl/core-svelte";
    import { componentId, RenderComponent as RenderComponentRecursive } from "@freon4dsl/core-svelte";
    import { onMount, tick } from "svelte";
    import SelectableWrapperComponent from "./SelectableWrapperComponent.svelte";

    // Set to true to enable CustomActionsComponent debug logging
    let customActionsLoggingEnabled = false;

    function logInfo(...args: any[]) {
        if (customActionsLoggingEnabled) console.log(...args);
    }
    function logError(...args: any[]) {
        if (customActionsLoggingEnabled) console.error(...args);
    }
    function logWarn(...args: any[]) {
        if (customActionsLoggingEnabled) console.warn(...args);
    }

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
                logInfo('🔵 CustomActionsComponent: directNodeValue derived', {
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
                logInfo('🔵 CustomActionsComponent: hasDirectValue = true', {
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
    
    // Compute the node value to use for rendering (combined from multiple sources)
    // This consolidates the value lookup to avoid calling getBox() in the template
    let nodeValueForRendering = $derived.by(() => {
        propertyValueVersion; // Force reactivity
        return directNodeValue || currentPropertyValue;
    });
    
    // Pre-compute the projection box for nodeValueForRendering
    // IMPORTANT: This must be in $derived, not in the template, to avoid state_unsafe_mutation errors
    // getBox() internally calls refreshComponent() which mutates state
    let projectionBox = $state<any>(null);
    let projectionBoxProvider = $state<any>(null);
    
    // Use $effect to compute projection box outside of reactive derivation context
    $effect(() => {
        propertyValueVersion; // Force reactivity
        if (nodeValueForRendering && editor?.projection) {
            // Use untrack to prevent this from being treated as a reactive dependency
            // that could cause infinite loops
            try {
                const newPropBox = editor.projection.getBox(nodeValueForRendering);
                projectionBox = newPropBox;
                
                if (!newPropBox) {
                    const newBoxProvider = editor.projection.getBoxProvider(nodeValueForRendering);
                    projectionBoxProvider = newBoxProvider;
                } else {
                    projectionBoxProvider = null;
                }
                
                logInfo('🔵 CustomActionsComponent: Computed projectionBox in $effect', {
                    nodeValueType: nodeValueForRendering?.freLanguageConcept?.(),
                    hasPropBox: !!newPropBox,
                    propBoxKind: newPropBox?.kind
                });
            } catch (e) {
                logError('🔵 CustomActionsComponent: Error computing projectionBox', e);
                projectionBox = null;
                projectionBoxProvider = null;
            }
        } else {
            projectionBox = null;
            projectionBoxProvider = null;
        }
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
    // Make this reactive to property value changes by depending on propertyValueVersion
    $effect(() => {
        propertyValueVersion; // Make this reactive to property value changes
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
            logInfo('🔵 CustomActionsComponent: PartReplacerBox detected', {
                propertyName,
                hasValue: currentValue !== null && currentValue !== undefined,
                value: currentValue,
                hasDirectValue: hasDirect,
                directValue: directValue?.freLanguageConcept?.(),
                propertyValueVersion
            });
            
            // If PartReplacerBox already has a value, we should show it (not create ActionBox)
            // The component will handle this via hasValue check in the template
            // Check both getPropertyValue() and direct node access for interface types
            const hasValueNow = (currentValue !== null && currentValue !== undefined) || hasDirect;
            if (hasValueNow) {
                // Has value - don't create ActionBox, let the view mode show the value
                logInfo('🔵 CustomActionsComponent: Has value, not creating ActionBox', {
                    propertyName,
                    currentValue: currentValue?.freLanguageConcept?.(),
                    hasDirect,
                    directValue: directValue?.freLanguageConcept?.(),
                    propertyValueVersion
                });
                actionBox = null;
                return; // Exit early - the value will be shown in view mode
            }
            
            // No value - create ActionBox to show the list
            logInfo('🔵 CustomActionsComponent: No value, creating ActionBox', {
                propertyName,
                currentValue,
                hasDirect,
                directValue,
                propertyValueVersion
            });
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
                        logInfo(`🔵 CustomActionsComponent: Using hardcoded mapping for ${propType}:`, implementingConceptNames);
                        
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
                logError(`CustomActionsComponent: Could not get property type for ${propertyName}`);
                actionBox = null;
            }
        } else {
            // This component should only be used for ActionBox or PartReplacerBox
            logWarn("CustomActionsComponent: Expected ActionBox or PartReplacerBox but got", box?.kind || typeof box);
            actionBox = null;
        }
    });
    
    // Get all options from the ActionBox
    let allOptions = $derived(
        actionBox ? actionBox.getOptions(editor) : []
    );
    
    // Define sort order for options based on Scheduling.edit file
    // This ensures dropdown items appear in the same order as defined in the editor definition
    const getSortOrder = (conceptName: string, propertyName: string): number => {
        // EventStart order from Scheduling.edit (lines 74-112)
        if (propertyName === 'eventStart' || conceptName === 'EventStart') {
            const eventStartOrder: Record<string, number> = {
                'StudyStart': 1,
                'FirstDayOfStudy': 2,
                // 'Baseline': 3, // removed - was sub-concept of FirstDayOfStudy
                'Day': 4,
                'When': 5,
                // 'Previous': 6, // removed - concept commented out
                // 'Unscheduled': 7, // removed - concept commented out
                // 'AnyDay': 8 // removed - was sub-concept of Unscheduled
            };
            return eventStartOrder[conceptName] ?? 999; // Unknown concepts go to end
        }
        
        // RepeatUnit order from Scheduling.edit (lines 37-55, 163-166)
        if (propertyName === 'repeatUnit' || conceptName === 'RepeatUnit') {
            const repeatUnitOrder: Record<string, number> = {
                'Daily': 1,
                'Weekly': 2,
                'Monthly': 3,
                'Forever': 4,
                'RepeatEvery': 5
            };
            return repeatUnitOrder[conceptName] ?? 999;
        }
        
        // RepeatExpression order from Scheduling.edit (lines 163-179)
        if (propertyName === 'eventRepeat' || propertyName === 'repeatExpression' || conceptName === 'RepeatExpression') {
            const repeatExpressionOrder: Record<string, number> = {
                'RepeatCondition': 1,
                'RepeatCount': 2
            };
            return repeatExpressionOrder[conceptName] ?? 999;
        }
        
        // EventTimeOfDay order from Scheduling.edit (lines 137-156)
        if (propertyName === 'eventTimeOfDay' || conceptName === 'EventTimeOfDay') {
            const eventTimeOfDayOrder: Record<string, number> = {
                'BetweenTimes': 1,
                'StartingBy': 2,
                'EndingBy': 3
            };
            return eventTimeOfDayOrder[conceptName] ?? 999;
        }
        
        // No specific order defined - maintain original order
        return 999;
    };
    
    // Sort options based on Scheduling.edit order
    let sortedOptions = $derived.by(() => {
        if (!actionBox) return [];
        
        const propertyName = actionBox.propertyName || '';
        const conceptName = actionBox.conceptName || '';
        const options = [...allOptions];
        
        // Sort by the order defined in Scheduling.edit
        return options.sort((a, b) => {
            // Extract concept name from option id (which is the concept name)
            const aConcept = a.id;
            const bConcept = b.id;
            
            // Try propertyName first, then conceptName
            const aOrder = getSortOrder(aConcept, propertyName);
            const bOrder = getSortOrder(bConcept, propertyName);
            
            // If propertyName didn't give us an order, try conceptName
            const aOrderFinal = aOrder !== 999 ? aOrder : getSortOrder(aConcept, conceptName);
            const bOrderFinal = bOrder !== 999 ? bOrder : getSortOrder(bConcept, conceptName);
            
            // If both have defined orders, sort by order
            if (aOrderFinal !== 999 || bOrderFinal !== 999) {
                return aOrderFinal - bOrderFinal;
            }
            
            // Otherwise maintain original order (alphabetical by label)
            return a.label.localeCompare(b.label);
        });
    });
    
    // Debug logging
    $effect(() => {
        if (actionBox) {
            const opts = actionBox.getOptions(editor);
            logInfo('🔵 CustomActionsComponent: allOptions', { 
                count: opts.length, 
                options: opts.map(o => ({ id: o.id, label: o.label })),
                propertyName: actionBox.propertyName,
                conceptName: actionBox.conceptName,
                boxKind: box?.kind
            });
            logInfo('🔵 CustomActionsComponent: sortedOptions', {
                count: sortedOptions.length,
                options: sortedOptions.map(o => ({ id: o.id, label: o.label, order: getSortOrder(o.id, actionBox.propertyName || '') }))
            });
        }
    });
    
    // Convert SelectOption[] to Listbox format (label and value) - use sorted options
    let listboxData = $derived(
        sortedOptions.map((opt) => ({
            label: opt.label,
            value: opt.id,
            option: opt, // Keep reference to original SelectOption
        }))
    );
    
    // Debug logging for listboxData
    $effect(() => {
        logInfo('🔵 CustomActionsComponent: listboxData', { 
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
        // Extract prefix from search text (before colon) for matching
        const searchParts = searchText.split(':');
        const searchPrefix = searchParts[0].trim();
        const matches = new Set<number>();
        listboxData.forEach((item, index) => {
            // Extract the prefix part (before colon) for matching
            const labelParts = item.label.split(':');
            const prefix = labelParts[0].trim().toLowerCase();
            // Match against the prefix only (the part before the colon) - must start with searchPrefix
            if (prefix.startsWith(searchPrefix)) {
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
        const oldText = text;
        const oldSelectedIndex = selectedIndex;
        text = newText;
        dropdownOpen = true;
        // Reset selectedIndex when text changes
        selectedIndex = -1;
        
        logInfo('🔵 CustomActionsComponent: onInputChange', {
            oldText,
            newText,
            oldSelectedIndex,
            newSelectedIndex: selectedIndex
        });
        
        // Update input width
        tick().then(() => {
            setInputWidth();
        });
    }
    
    // Handle selection from listbox item
    function selectItem(item: typeof listboxData[0]) {
        logInfo('🔵 CustomActionsComponent: selectItem called', { 
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
                // Wrap in AST.changeNamed() to ensure it's properly captured for undo/redo
                let result: any;
                AST.changeNamed(`CustomActionsComponent: Create ${item.label}`, () => {
                    result = actionBox.executeOption(editor, item.option);
                });
                logInfo('🔵 CustomActionsComponent: executeOption result', result);
                
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
                        logInfo('🔵 CustomActionsComponent: After executeOption', {
                            propertyName,
                            nodeValue,
                            nodeValueType: nodeValue?.freLanguageConcept(),
                            getPropertyValue: box.getPropertyValue(),
                            propertyType: box.getPropertyType?.()
                        });
                        
                        // Force reactive update by incrementing version FIRST
                        propertyValueVersion++;
                        logInfo('🔵 CustomActionsComponent: Incremented propertyValueVersion to:', propertyValueVersion);
                        
                        // Wait a tick for the AST change to propagate
                        return tick();
                    }).then(() => {
                        // Force another reactive update after AST change
                        propertyValueVersion++;
                        logInfo('🔵 CustomActionsComponent: Second propertyValueVersion increment to:', propertyValueVersion);
                        
                        // Force refresh the component to show the new value
                        if (box && box.refreshComponent) {
                            logInfo('🔵 CustomActionsComponent: Calling box.refreshComponent()');
                            box.refreshComponent();
                        }
                    });
                }
            } else if (item.option.action) {
                // Fallback: execute action directly if we don't have a box
                // Use the original box (PartReplacerBox) so the action sets the value on the correct node
                // Wrap in AST.changeNamed() to ensure it's properly captured for undo/redo
                let result: any;
                AST.changeNamed(`CustomActionsComponent: Create ${item.label}`, () => {
                    result = item.option.action.execute(box, item.option.label, editor);
                });
                logInfo('🔵 CustomActionsComponent: action.execute result', result);
                
                dropdownOpen = false;
                endEditing();
                
                // Force refresh
                tick().then(() => {
                    const newValue = box.getPropertyValue();
                    logInfo('🔵 CustomActionsComponent: After action.execute, property value:', newValue);
                    
                    // Force reactive update by incrementing version
                    propertyValueVersion++;
                    
                    if (box && box.refreshComponent) {
                        box.refreshComponent();
                    }
                });
            } else {
                logError('🔵 CustomActionsComponent: No box or action available to execute');
                dropdownOpen = false;
                endEditing();
            }
        } else {
            logError('🔵 CustomActionsComponent: selectItem failed', { item: !!item, hasOption: !!item?.option });
        }
    }
    
    // Track selected index for arrow key navigation
    let selectedIndex = $state(-1);
    
    // Handle typing full name - check if it matches exactly, or if there's only one match from start
    function checkExactMatch() {
        logInfo('🔵 CustomActionsComponent: checkExactMatch called', {
            hasActionBox: !!actionBox,
            selectedIndex,
            text,
            listboxDataLength: listboxData.length,
            matchingItemsLength: matchingItems.length,
            hasSingleMatch,
            matchCount
        });
        
        if (!actionBox) {
            logInfo('🔵 CustomActionsComponent: checkExactMatch - no actionBox, returning');
            return;
        }
        
        // First priority: Check if user has navigated to an item with arrow keys (even if text is empty)
        logInfo('🔵 CustomActionsComponent: checkExactMatch - checking selectedIndex', {
            selectedIndex,
            listboxDataLength: listboxData.length,
            isValidIndex: selectedIndex >= 0 && selectedIndex < listboxData.length
        });
        
        if (selectedIndex >= 0 && selectedIndex < listboxData.length) {
            const selectedItem = listboxData[selectedIndex];
            logInfo('🔵 CustomActionsComponent: checkExactMatch - found selectedItem via selectedIndex', {
                selectedIndex,
                itemLabel: selectedItem?.label,
                hasOption: !!selectedItem?.option
            });
            if (selectedItem && selectedItem.option) {
                logInfo('🔵 CustomActionsComponent: checkExactMatch - calling selectItem with selectedIndex item');
                selectItem(selectedItem);
                return;
            } else {
                logInfo('🔵 CustomActionsComponent: checkExactMatch - selectedItem found but no option', {
                    selectedItem: !!selectedItem,
                    hasOption: !!selectedItem?.option
                });
            }
        }
        
        // If text is empty and no selectedIndex, just exit
        if (!text.trim()) {
            logInfo('🔵 CustomActionsComponent: checkExactMatch - text is empty and no selectedIndex, closing dropdown');
            dropdownOpen = false;
            return;
        }
        
        const searchText = text.trim().toLowerCase();
        
        // Second priority: Check for exact match
        const exactMatch = listboxData.find(item => 
            item.label.toLowerCase() === searchText
        );
        
        logInfo('🔵 CustomActionsComponent: checkExactMatch - checking exact match', {
            searchText,
            exactMatch: exactMatch ? exactMatch.label : null,
            hasOption: !!exactMatch?.option
        });
        
        if (exactMatch && exactMatch.option) {
            logInfo('🔵 CustomActionsComponent: checkExactMatch - calling selectItem with exact match');
            selectItem(exactMatch);
            return;
        }
        
        // Third priority: Check if there's exactly one match from start (auto-select on tab out)
        logInfo('🔵 CustomActionsComponent: checkExactMatch - checking single match', {
            hasSingleMatch,
            matchCount,
            matchingItemIndices: Array.from(matchingItemIndices)
        });
        
        if (hasSingleMatch && matchCount === 1) {
            const matchingIndex = Array.from(matchingItemIndices)[0];
            const singleMatch = listboxData[matchingIndex];
            logInfo('🔵 CustomActionsComponent: checkExactMatch - found single match', {
                matchingIndex,
                itemLabel: singleMatch?.label,
                hasOption: !!singleMatch?.option
            });
            if (singleMatch && singleMatch.option) {
                logInfo('🔵 CustomActionsComponent: checkExactMatch - calling selectItem with single match');
                selectItem(singleMatch);
            } else {
                logInfo('🔵 CustomActionsComponent: checkExactMatch - single match found but no option, ending editing');
                dropdownOpen = false;
                endEditing();
            }
        } else {
            // No single match - just exit
            logInfo('🔵 CustomActionsComponent: checkExactMatch - no match found, ending editing');
            dropdownOpen = false;
            endEditing();
        }
    }
    
    // Start editing - show input and dropdown
    async function startEditing() {
        isEditing = true;
        dropdownOpen = true;
        selectedIndex = -1;
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
        selectedIndex = -1;
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
        // Increment propertyValueVersion to force reactive updates when property value changes
        // This is needed when deletion happens from child components like SelectableWrapperComponent
        const oldVersion = propertyValueVersion;
        propertyValueVersion++;
        
        // After property value changes, we need to recreate actionBox if the value was deleted
        if (isPartReplacerBox(box)) {
            const propertyName = box.propertyName;
            const nodeValue = box.node[propertyName];
            const hasValue = nodeValue && typeof nodeValue === 'object' && 'freLanguageConcept' in nodeValue;
            
            // If value was deleted (no value), recreate actionBox
            if (!hasValue && !actionBox) {
                logInfo('🔵 CustomActionsComponent: refresh - value deleted, will recreate actionBox in next effect');
            }
        }
        
        logInfo('🔵 CustomActionsComponent: refresh called', {
            why,
            propertyName: isPartReplacerBox(box) ? box.propertyName : 'N/A',
            oldVersion,
            newVersion: propertyValueVersion,
            nodePropertyValue: isPartReplacerBox(box) && box.propertyName ? (box.node[box.propertyName]?.freLanguageConcept?.() || null) : null,
            hasDirectValue: isPartReplacerBox(box) ? (box.node[box.propertyName] && typeof box.node[box.propertyName] === 'object' && 'freLanguageConcept' in box.node[box.propertyName]) : false,
            hasActionBox: !!actionBox
        });
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
        logInfo('🔵 CustomActionsComponent: onKeyDown', { 
            key: event.key, 
            selectedIndex, 
            text, 
            listboxDataLength: listboxData.length,
            matchingItemsLength: matchingItems.length
        });
        
        // Allow Tab to leave (will end editing via onFocusOut)
        if (event.key === 'Tab') {
            logInfo('🔵 CustomActionsComponent: Tab pressed, calling checkExactMatch', {
                selectedIndex,
                text,
                listboxDataLength: listboxData.length
            });
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
            logInfo('🔵 CustomActionsComponent: Enter pressed, calling checkExactMatch', {
                selectedIndex,
                text,
                listboxDataLength: listboxData.length
            });
            event.preventDefault();
            event.stopPropagation();
            checkExactMatch();
            return;
        }
        
        // Handle Arrow keys - navigate through options
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            logInfo('🔵 CustomActionsComponent: Arrow key pressed', { key: event.key, dropdownOpen, listboxDataLength: listboxData.length, text });
            event.preventDefault();
            event.stopPropagation();
            
            // Ensure dropdown is open
            if (!dropdownOpen) {
                dropdownOpen = true;
            }
            
            // Always navigate through all items in the list
            if (listboxData.length === 0) {
                logInfo('🔵 CustomActionsComponent: Arrow keys: No items to navigate', { listboxData: listboxData.length, text });
                return;
            }
            
            // Find the current selected index
            let currentIndex = selectedIndex >= 0 && selectedIndex < listboxData.length ? selectedIndex : -1;
            
            // Determine new index based on arrow direction and current state
            let newIndex = -1;
            const hasText = text.trim().length > 0;
            const hasMultipleMatches = matchCount > 1 && hasText;
            
            if (event.key === 'ArrowDown') {
                // Down arrow
                if (currentIndex < 0 || hasMultipleMatches) {
                    // Nothing selected OR multiple items match - go to first item
                    newIndex = 0;
                } else {
                    // One item selected - move to next item, wrap around if at end
                    newIndex = (currentIndex + 1) % listboxData.length;
                }
            } else {
                // ArrowUp
                if (currentIndex < 0 || hasMultipleMatches) {
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
            
            // Update selectedIndex and text for visual feedback
            if (newIndex >= 0 && newIndex < listboxData.length) {
                const selectedItem = listboxData[newIndex];
                
                if (selectedItem) {
                    selectedIndex = newIndex;
                    text = selectedItem.label; // Update text for visual feedback
                    logInfo('🔵 CustomActionsComponent: Arrow keys: Updated selection', { 
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
                logInfo('🔵 CustomActionsComponent: Arrow keys: Invalid newIndex', { newIndex, listboxDataLength: listboxData.length });
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
        const relatedTarget = event.relatedTarget as HTMLElement;
        
        logInfo('🔵 CustomActionsComponent: onFocusOut', {
            relatedTarget: relatedTarget?.tagName || 'null',
            selectedIndex,
            text
        });
        
        if (relatedTarget) {
            if (
                (inputElement && inputElement.contains(relatedTarget)) ||
                (dropdownElement && dropdownElement.contains(relatedTarget)) ||
                (componentWrapper && componentWrapper.contains(relatedTarget))
            ) {
                logInfo('🔵 CustomActionsComponent: onFocusOut - focus still within component, returning');
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
                    logInfo('🔵 CustomActionsComponent: onFocusOut - activeElement still within component, returning');
                    return;
                }
            }
            logInfo('🔵 CustomActionsComponent: onFocusOut - calling checkExactMatch then endEditing');
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

{#if (() => {
    // Debug logging for the if condition - always log to see what's happening
    const conditionResult = actionBox || (isPartReplacerBox(box) && (hasDirectValue || (hasValue && currentPropertyValue)));
    const debugInfo = {
        hasActionBox: !!actionBox,
        isPartReplacerBox: isPartReplacerBox(box),
        hasDirectValue,
        hasValue,
        currentPropertyValue: currentPropertyValue?.freLanguageConcept?.(),
        propertyValueVersion,
        conditionResult,
        propertyName: isPartReplacerBox(box) ? box.propertyName : 'N/A',
        rawNodeValue: isPartReplacerBox(box) && box.propertyName ? (box.node[box.propertyName]?.freLanguageConcept?.() || (box.node[box.propertyName] === null ? 'null' : (box.node[box.propertyName] === undefined ? 'undefined' : String(box.node[box.propertyName])))) : 'N/A'
    };
    logInfo('🔵 CustomActionsComponent: If condition evaluation', debugInfo);
    return conditionResult;
})()}
    {@const checkDirectValue = directNodeValue || currentPropertyValue}
    {@const hasDirectValueInTemplate = checkDirectValue !== null && checkDirectValue !== undefined}
    {@const shouldShowValue = hasDirectValueInTemplate || hasDirectValue || (hasValue && currentPropertyValue)}
    {@const nodeValueToUse = checkDirectValue || directNodeValue || currentPropertyValue}
    {(() => {
        if (isPartReplacerBox(box)) {
            const rawNodeValue = box.node[box.propertyName];
            logInfo('🔵 CustomActionsComponent: Template rendering decision', {
                propertyName: box.propertyName,
                hasDirectValueInTemplate,
                hasDirectValue,
                hasValue,
                currentPropertyValue: currentPropertyValue?.freLanguageConcept?.(),
                shouldShowValue,
                boxChildren: box.children?.length || 0,
                checkDirectValue: checkDirectValue?.freLanguageConcept?.(),
                rawNodeValue: rawNodeValue?.freLanguageConcept?.() || (rawNodeValue === null ? 'null' : (rawNodeValue === undefined ? 'undefined' : String(rawNodeValue))),
                propertyValueVersion,
                nodeValueToUse: nodeValueToUse?.freLanguageConcept?.()
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
                    logInfo('🔵 CustomActionsComponent: Rendering value path', {
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
                <SelectableWrapperComponent {box} {editor}>
                    {#each box.children as childBox}
                        <RenderComponentRecursive box={childBox} {editor} />
                    {/each}
                </SelectableWrapperComponent>
            {:else if nodeValueToUse && editor?.projection}
                <!-- Second: Use pre-computed projectionBox (computed in $effect to avoid state_unsafe_mutation) -->
                {#if projectionBox}
                    <SelectableWrapperComponent {box} {editor}>
                        <RenderComponentRecursive box={projectionBox} {editor} />
                    </SelectableWrapperComponent>
                {:else if projectionBoxProvider && projectionBoxProvider.box}
                    <!-- Third: Use pre-computed boxProvider -->
                    <SelectableWrapperComponent {box} {editor}>
                        <RenderComponentRecursive box={projectionBoxProvider.box} {editor} />
                    </SelectableWrapperComponent>
                {:else}
                    <!-- Last resort: show concept name -->
                    {(() => {
                        logInfo('🔵 CustomActionsComponent: Falling back to concept name', {
                            nodeValueType: nodeValueToUse?.freLanguageConcept?.()
                        });
                        return '';
                    })()}
                    <SelectableWrapperComponent {box} {editor}>
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
                    </SelectableWrapperComponent>
                {/if}
            {:else if nodeValueToUse}
                <!-- No projectionHandler: show concept name -->
                <SelectableWrapperComponent {box} {editor}>
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
                </SelectableWrapperComponent>
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
                            {#each listboxData as item, index (item.value + '-' + index)}
                                {@const isMatch = matchingItemIndices.has(index)}
                                {@const isHighlighted = isMatch && text.trim().length > 0}
                                {@const isSelected = selectedIndex === index}
                                {@const matchClass = isHighlighted ? (hasSingleMatch ? 'matched' : hasMultipleMatches ? 'matched-multiple' : '') : ''}
                                {@const colonIndex = item.label.indexOf(':')}
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
                                            logInfo('🔵 CustomActionsComponent: item clicked', { itemLabel: item.label, index });
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
                                    {#if colonIndex >= 0}
                                        <span class="label">
                                            <span class="prefix">{item.label.substring(0, colonIndex)}:</span>
                                            <span class="suffix">{item.label.substring(colonIndex + 1)}</span>
                                        </span>
                                    {:else}
                                        <span class="prefix">{item.label}</span>
                                    {/if}
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

