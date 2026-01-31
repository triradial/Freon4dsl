<script lang="ts">
    import { AST, isNumberReplacerBox, isPartReplacerBox, type Box } from "@freon4dsl/core";
    import { onMount, tick } from "svelte";

    /** Set to true to log when numeric value is written to the model (for debugging). */
    const DEBUG_NUMERIC_INPUT = false;

    function logInfo(...args: unknown[]): void {
        if (DEBUG_NUMERIC_INPUT) console.log("[CustomNumericComponent]", ...args);
    }

    function logWarn(...args: unknown[]): void {
        if (DEBUG_NUMERIC_INPUT) console.warn("[CustomNumericComponent]", ...args);
    }

    function logError(...args: unknown[]): void {
        if (DEBUG_NUMERIC_INPUT) console.error("[CustomNumericComponent]", ...args);
    }

    let { box, isEditing = $bindable(false) } = $props<{ box: Box; isEditing?: boolean }>();
    let value = $state<string>("");
    // svelte-ignore non_reactive_update
    let inputElement: HTMLInputElement | null = null;
    // svelte-ignore non_reactive_update
    let spanElement: HTMLSpanElement | null = null;
    // svelte-ignore non_reactive_update
    let widthSpan: HTMLSpanElement | null = null;
    
    // Check if current value is invalid (including default "0")
    function isCurrentValueInvalid(): boolean {
        const trimmed = value.trim();
        if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") {
            return false; // Incomplete values are not considered invalid yet
        }
        return !isValidNumericValue(trimmed);
    }
    
    // Generate tooltip message with range
    function getTooltipMessage(): string {
        const minVal = getMin();
        const maxVal = getMax();
        
        // Always show range information if available
        if (minVal !== undefined && maxVal !== undefined) {
            return `Value must be between ${minVal} and ${maxVal}.`;
        } else if (minVal !== undefined) {
            return `Value must be at least ${minVal}.`;
        } else if (maxVal !== undefined) {
            return `Value must be at most ${maxVal}.`;
        }
        
        // If no range constraints, check if current value is invalid
        const trimmed = value.trim();
        if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") {
            return "";
        }
        
        const num = parseFloat(trimmed);
        if (isNaN(num)) {
            return "Please enter a valid number.";
        }
        
        return "";
    }

    // Get parameters from the language - access directly, not as derived values
    function getMinValue(): string | undefined {
        return box.findParam("min");
    }
    
    function getMaxValue(): string | undefined {
        return box.findParam("max");
    }
    
    function getAllowDecimals(): boolean {
        return box.findParam("allowDecimals") !== "false"; // default to true
    }
    
    function getPlaceholder(): string {
        return box.findParam("placeholder") || "";
    }

    // Parse min/max as numbers if provided
    function getMin(): number | undefined {
        const minVal = getMinValue();
        return minVal ? parseFloat(minVal) : undefined;
    }
    
    function getMax(): number | undefined {
        const maxVal = getMaxValue();
        return maxVal ? parseFloat(maxVal) : undefined;
    }

    function isNumeric(str: string): boolean {
        if (str === "" || str === "-" || str === "." || str === "-.") {
            return true; // Allow intermediate states during typing
        }
        // Allow negative numbers and decimals
        const numericRegex = getAllowDecimals() 
            ? /^-?\d*\.?\d*$/ 
            : /^-?\d+$/;
        return numericRegex.test(str);
    }

    function isValidNumericValue(str: string): boolean {
        if (str === "" || str === "-" || str === "." || str === "-.") {
            return false; // Empty or incomplete values are not valid
        }
        const num = parseFloat(str);
        if (isNaN(num)) {
            return false;
        }
        // Check range if min/max are defined
        const minVal = getMin();
        const maxVal = getMax();
        if (minVal !== undefined && num < minVal) {
            return false;
        }
        if (maxVal !== undefined && num > maxVal) {
            return false;
        }
        return true;
    }

    function getValue() {
        if (isNumberReplacerBox(box)) {
            const propertyValue: number | undefined = box.getPropertyValue();
            if (typeof propertyValue === "number") {
                value = propertyValue.toString();
            } else {
                // Display "0" as default in UI, but don't write to model until user interacts
                value = "0";
            }
        } else if (isPartReplacerBox(box)) {
            // For PartReplacerBox (e.g., Days concept), get the count property from the node
            // Try getPropertyValue first, but also check node property directly
            let partNode = box.getPropertyValue();
            if (!partNode && box.propertyName) {
                // Fallback: try direct access from node
                partNode = (box.node as any)[box.propertyName];
            }
            if (partNode && typeof (partNode as any).count === "number") {
                value = ((partNode as any).count).toString();
            } else {
                value = "0";
            }
        } else {
            value = "0";
        }
        return value;
    }

    function setInputWidth() {
        if (widthSpan && inputElement) {
            let displayValue = inputElement.value || value;
            if (!displayValue || displayValue.length === 0) {
                const placeholder = getPlaceholder();
                displayValue = placeholder || "0";
                if (displayValue.length === 0) {
                    displayValue = " ";
                }
            }
            widthSpan.textContent = displayValue;
            const newWidth = widthSpan.offsetWidth + 'px';
            if (inputElement.style.width !== newWidth) {
                inputElement.style.width = newWidth;
            }
        }
    }

    async function startEditing() {
        isEditing = true;
        await tick(); // Wait for input element to be rendered
        if (inputElement) {
            setInputWidth();
            inputElement.focus();
            inputElement.select();
        }
    }

    function endEditing() {
        logInfo(' endEditing called', { isEditing, hasBox: !!box, boxKind: box?.kind });
        if (isEditing) {
            isEditing = false;
            // Normalize and validate on blur
            if (inputElement) {
                const trimmed = value.trim();
                
                if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") {
                    // Empty value - check if 0 is valid, otherwise don't set
                    const minVal = getMin();
                    const maxVal = getMax();
                    const numValue = 0;
                    
                    // Only set 0 if it's within the valid range
                    if (isFinite(numValue)) {
                        const isZeroValid = (minVal === undefined || numValue >= minVal) && 
                                           (maxVal === undefined || numValue <= maxVal);
                        if (isZeroValid) {
                            value = "0";
                            if (isNumberReplacerBox(box)) {
                                logInfo(' Setting property to 0 (endEditing) - NumberReplacerBox', {
                                    propertyName: box.propertyName,
                                    numValue,
                                    boxKind: box.kind
                                });
                                AST.changeNamed(`CustomNumericComponent: Set ${box.propertyName || 'property'} to ${numValue}`, () => {
                                    box.setPropertyValue(numValue);
                                });
                                logInfo(' AST.changeNamed completed for 0');
                            } else if (isPartReplacerBox(box)) {
                                // Try getPropertyValue first, but also check node property directly
                                let partNode = box.getPropertyValue();
                                if (!partNode && box.propertyName) {
                                    // Fallback: try direct access from node
                                    partNode = (box.node as any)[box.propertyName];
                                }
                                if (partNode) {
                                    logInfo(' Setting count to 0 (endEditing) - PartReplacerBox', {
                                        propertyName: box.propertyName,
                                        numValue,
                                        boxKind: box.kind,
                                        nodeConcept: (partNode as any).freLanguageConcept?.()
                                    });
                                    AST.changeNamed(`CustomNumericComponent: Set ${box.propertyName || 'property'}.count to ${numValue}`, () => {
                                        (partNode as any).count = numValue;
                                    });
                                    logInfo(' AST.changeNamed completed for 0 - PartReplacerBox');
                                } else {
                                    logWarn(' Could not find partNode for PartReplacerBox (setting 0)', {
                                        propertyName: box.propertyName,
                                        boxKind: box.kind
                                    });
                                }
                            }
                        } else {
                            // 0 is outside range, keep current value or leave undefined
                            // Don't update the model
                            value = trimmed || "0";
                        }
                    }
                    return;
                }

                const num = parseFloat(trimmed);
                if (isNaN(num) || !isFinite(num)) {
                    // Invalid number - don't update model, keep current value
                    return;
                }
                
                // Check range
                const minVal = getMin();
                const maxVal = getMax();
                if (minVal !== undefined && num < minVal) {
                    // Out of range - don't update model
                    return;
                } else if (maxVal !== undefined && num > maxVal) {
                    // Out of range - don't update model
                    return;
                } else {
                    // Valid value - update model (convert string to number)
                    value = trimmed;
                    const numValue = parseFloat(trimmed);
                    // Ensure it's a valid finite number before setting
                    if (isFinite(numValue)) {
                        if (isNumberReplacerBox(box)) {
                            logInfo(' Setting property value (endEditing) - NumberReplacerBox', {
                                propertyName: box.propertyName,
                                numValue,
                                trimmed,
                                boxKind: box.kind
                            });
                            AST.changeNamed(`CustomNumericComponent: Set ${box.propertyName || 'property'} to ${numValue}`, () => {
                                box.setPropertyValue(numValue);
                            });
                            logInfo(' AST.changeNamed completed (endEditing)');
                        } else if (isPartReplacerBox(box)) {
                            // Try getPropertyValue first, but also check node property directly
                            let partNode = box.getPropertyValue();
                            if (!partNode && box.propertyName) {
                                // Fallback: try direct access from node
                                partNode = (box.node as any)[box.propertyName];
                            }
                            if (partNode) {
                                logInfo(' Setting count property (endEditing) - PartReplacerBox', {
                                    propertyName: box.propertyName,
                                    numValue,
                                    trimmed,
                                    boxKind: box.kind,
                                    nodeConcept: (partNode as any).freLanguageConcept?.()
                                });
                                AST.changeNamed(`CustomNumericComponent: Set ${box.propertyName || 'property'}.count to ${numValue}`, () => {
                                    (partNode as any).count = numValue;
                                });
                                logInfo(' AST.changeNamed completed (endEditing) - PartReplacerBox');
                            } else {
                                logWarn(' Could not find partNode for PartReplacerBox (endEditing)', {
                                    propertyName: box.propertyName,
                                    boxKind: box.kind
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    async function setFocus() {
        if (isEditing && inputElement) {
            inputElement.focus();
            inputElement.select();
        } else {
            await startEditing();
        }
    }

    const refresh = (why?: string): void => {
        getValue();
    };

    onMount(() => {
        logInfo(' Component mounted', { 
            hasBox: !!box, 
            boxKind: box?.kind, 
            propertyName: (box as any)?.propertyName,
            initialValue: (box as any)?.getPropertyValue?.()
        });
        getValue();
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    $effect(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    function onInputChange(e: Event) {
        const newVal = (e.target as HTMLInputElement).value;
        logInfo(' onInputChange called', { newVal, hasBox: !!box, boxKind: box?.kind, propertyName: (box as any)?.propertyName });
        
        // Only allow numeric input
        if (isNumeric(newVal)) {
            value = newVal;
            // Only update model if it's a valid complete number
            if (isValidNumericValue(newVal)) {
                const numValue = parseFloat(newVal);
                // Ensure it's a valid finite number before setting
                if (isFinite(numValue)) {
                    if (isNumberReplacerBox(box)) {
                        logInfo(' Setting property value (onInputChange) - NumberReplacerBox', {
                            propertyName: box.propertyName,
                            numValue,
                            newVal,
                            boxKind: box.kind
                        });
                        AST.changeNamed(`CustomNumericComponent: Set ${box.propertyName || 'property'} to ${numValue}`, () => {
                            box.setPropertyValue(numValue);
                        });
                        logInfo(' AST.changeNamed completed (onInputChange)');
                    } else if (isPartReplacerBox(box)) {
                        // For PartReplacerBox (e.g., Days concept), set the count property on the node
                        // Try getPropertyValue first, but also check node property directly
                        let partNode = box.getPropertyValue();
                        if (!partNode && box.propertyName) {
                            // Fallback: try direct access from node
                            partNode = (box.node as any)[box.propertyName];
                        }
                        if (partNode) {
                            logInfo(' Setting count property (onInputChange) - PartReplacerBox', {
                                propertyName: box.propertyName,
                                numValue,
                                newVal,
                                boxKind: box.kind,
                                nodeConcept: (partNode as any).freLanguageConcept?.()
                            });
                            AST.changeNamed(`CustomNumericComponent: Set ${box.propertyName || 'property'}.count to ${numValue}`, () => {
                                (partNode as any).count = numValue;
                            });
                            logInfo(' AST.changeNamed completed (onInputChange) - PartReplacerBox');
                        } else {
                            logWarn(' Could not find partNode for PartReplacerBox', {
                                propertyName: box.propertyName,
                                boxKind: box.kind
                            });
                        }
                    }
                }
            }
            
            // Update input width to fit content
            tick().then(() => {
                setInputWidth();
            });
        } else {
            // Prevent non-numeric input by reverting to previous value
            if (inputElement) {
                inputElement.value = value;
            }
        }
    }

    // Check if adding a digit would exceed the range
    function wouldExceedRange(key: string): boolean {
        if (!inputElement || !/^\d$/.test(key)) {
            return false;
        }
        
        const cursorPos = inputElement.selectionStart || 0;
        const selectionEnd = inputElement.selectionEnd || 0;
        const beforeCursor = value.slice(0, cursorPos);
        const afterCursor = value.slice(selectionEnd);
        const newValue = beforeCursor + key + afterCursor;
        
        // Check if the new value would be valid
        if (!isNumeric(newValue)) {
            return false;
        }
        
        // If it's an incomplete value, allow it
        if (newValue === "" || newValue === "-" || newValue === "." || newValue === "-.") {
            return false;
        }
        
        const minVal = getMin();
        const maxVal = getMax();
        
        // Check if it would exceed max
        if (maxVal !== undefined) {
            // Get the integer part (without decimals and minus sign)
            const integerPart = newValue.split('.')[0].replace(/^-/, '');
            
            // Calculate the maximum number of digits for the max value
            const maxDigits = Math.floor(Math.log10(Math.abs(maxVal))) + 1;
            const integerDigits = integerPart.length;
            
            // If we have more integer digits than max allows, prevent
            // Example: max=999 (3 digits), if user types 4th digit, prevent
            if (integerDigits > maxDigits) {
                return true;
            }
            
            // If we have the same number of digits as max, check if the number exceeds max
            // Example: max=999, if user has "99" and types "9" to make "999", allow
            // But if they have "999" and try to type another digit, prevent
            if (integerDigits === maxDigits) {
                const num = parseFloat(newValue);
                if (!isNaN(num) && num > maxVal) {
                    return true;
                }
                
                // Also check if the integer part alone would exceed max
                // This catches cases where typing a digit in the middle would create a number > max
                const integerNum = parseInt(integerPart, 10);
                if (!isNaN(integerNum) && integerNum > maxVal) {
                    return true;
                }
            }
        }
        
        return false;
    }

    function onKeyDown(event: KeyboardEvent) {
        // Suppress Enter key
        if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            // End editing on Enter
            endEditing();
            return;
        }

        // Allow navigation and editing keys
        if (
            event.key === "Backspace" ||
            event.key === "Delete" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            event.key === "Home" ||
            event.key === "End" ||
            event.key === "Tab" ||
            (event.ctrlKey && (event.key === "a" || event.key === "c" || event.key === "v" || event.key === "x"))
        ) {
            event.stopPropagation();
            return;
        }

        // Allow minus sign at the start
        if (event.key === "-" && inputElement) {
            const cursorPos = inputElement.selectionStart || 0;
            if (cursorPos === 0 && !value.includes("-")) {
                event.stopPropagation();
                return;
            }
        }

        // Allow decimal point if decimals are allowed
        if (event.key === "." && getAllowDecimals() && inputElement) {
            if (!value.includes(".")) {
                event.stopPropagation();
                return;
            }
        }

        // Check numeric keys - prevent if it would exceed range
        if (/^\d$/.test(event.key)) {
            if (wouldExceedRange(event.key)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            event.stopPropagation();
            return;
        }

        // Block all other keys
        event.preventDefault();
        event.stopPropagation();
    }

    function onFocusOut() {
        endEditing();
    }

    function onMouseDown(event: MouseEvent) {
        if (event.button === 0) { // left click
            event.preventDefault();
            event.stopPropagation();
            startEditing();
        }
    }

    function onSpanKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            startEditing();
        }
    }

    function onSpanFocusIn() {
        // When span receives focus (e.g., from tabbing), switch to edit mode
        startEditing();
    }

    function onPaste(e: ClipboardEvent) {
        // Handle paste - validate pasted content
        e.preventDefault();
        e.stopPropagation();
        const clipboardData = e.clipboardData || (e as any).originalEvent?.clipboardData;
        if (clipboardData) {
            const pastedText = clipboardData.getData('text');
            if (pastedText && isNumeric(pastedText) && isValidNumericValue(pastedText)) {
                value = pastedText;
                const numValue = parseFloat(pastedText);
                // Ensure it's a valid finite number before setting
                if (isFinite(numValue)) {
                    if (isNumberReplacerBox(box)) {
                        logInfo(' Setting property value (onPaste) - NumberReplacerBox', {
                            propertyName: box.propertyName,
                            numValue,
                            pastedText,
                            boxKind: box.kind
                        });
                        AST.changeNamed(`CustomNumericComponent: Set ${box.propertyName || 'property'} to ${numValue}`, () => {
                            box.setPropertyValue(numValue);
                        });
                        logInfo(' AST.changeNamed completed (onPaste)');
                    } else if (isPartReplacerBox(box)) {
                        // Try getPropertyValue first, but also check node property directly
                        let partNode = box.getPropertyValue();
                        if (!partNode && box.propertyName) {
                            // Fallback: try direct access from node
                            partNode = (box.node as any)[box.propertyName];
                        }
                        if (partNode) {
                            logInfo(' Setting count property (onPaste) - PartReplacerBox', {
                                propertyName: box.propertyName,
                                numValue,
                                pastedText,
                                boxKind: box.kind,
                                nodeConcept: (partNode as any).freLanguageConcept?.()
                            });
                            AST.changeNamed(`CustomNumericComponent: Set ${box.propertyName || 'property'}.count to ${numValue}`, () => {
                                (partNode as any).count = numValue;
                            });
                            logInfo(' AST.changeNamed completed (onPaste) - PartReplacerBox');
                        } else {
                            logWarn(' Could not find partNode for PartReplacerBox (onPaste)', {
                                propertyName: box.propertyName,
                                boxKind: box.kind
                            });
                        }
                    }
                }
                // Update input width
                tick().then(() => {
                    setInputWidth();
                });
                // Trigger validation
                setTimeout(() => {
                    if (inputElement) {
                        inputElement.blur();
                        inputElement.focus();
                    }
                }, 0);
            }
        }
    }

    // Track if value is invalid for styling
    let isInvalid = $derived(isCurrentValueInvalid());
    let tooltipMessage = $derived(getTooltipMessage());
    
    // Track hover state for tooltip
    let isHovered = $state(false);
    
    // Show tooltip whenever hovering (if there's a message to show)
    let showTooltip = $derived(isHovered && tooltipMessage.length > 0);
    
    function onMouseEnter() {
        isHovered = true;
    }
    
    function onMouseLeave() {
        isHovered = false;
    }

    // Update input width when entering edit mode
    $effect(() => {
        if (isEditing) {
            tick().then(() => {
                setInputWidth();
            });
        }
    });
</script>

<span class="inline-flex flex-col align-middle numeric-component-wrapper">
    {#if showTooltip}
        <div class="numeric-tooltip" role="tooltip">
            <div class="numeric-tooltip-content">{tooltipMessage}</div>
            <div class="numeric-tooltip-arrow"></div>
        </div>
    {/if}
    {#if isEditing}
        <span class="text-component-input-wrapper" role="group" onmouseenter={onMouseEnter} onmouseleave={onMouseLeave}>
            <input
                bind:this={inputElement}
                class="text-component-input {isInvalid ? 'numeric-invalid' : ''}"
                type="text"
                inputmode="numeric"
                placeholder={getPlaceholder()}
                bind:value={value}
                tabindex="0"
                oninput={onInputChange}
                onkeydown={onKeyDown}
                onfocusout={onFocusOut}
                onpaste={onPaste}
            />
            <span class="text-component-width" bind:this={widthSpan}></span>
        </span>
    {:else}
        <span
            bind:this={spanElement}
            class="text-component-text cursor-pointer {isInvalid ? 'numeric-invalid' : ''}"
            tabindex="0"
            role="textbox"
            onmousedown={onMouseDown}
            onkeydown={onSpanKeyDown}
            onfocusin={onSpanFocusIn}
            onmouseenter={onMouseEnter}
            onmouseleave={onMouseLeave}
        >
            {#if !!value && value.trim().length > 0}
                {value}
            {:else}
                <span class="text-component-text">{getPlaceholder() || "0"}</span>
            {/if}
        </span>
    {/if}
</span>
