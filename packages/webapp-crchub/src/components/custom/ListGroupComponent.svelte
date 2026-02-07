<script lang="ts">
    import { AST, FreLanguage, FreLogger, PartWrapperBox, type FreNode } from "@freon4dsl/core";
    import { componentId, RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { onDestroy, onMount } from "svelte";
    import { expandCollapseStore } from "../../services/stores/expand-collapse-store.js";
    import { showPasteDuplicatesReport, showPasteError } from "../../services/stores/paste-duplicates-store.js";
// ts-ignore
    import { ChevronDown as IconChevronDown, ChevronRight as IconChevronRight, EllipsisVertical as IconEllipsisVertical, Plus as IconPlus, ClipboardPaste as IconClipboardPaste } from '@lucide/svelte';

    const LOGGER = new FreLogger("ListGroupComponent");
    FreLogger.unmute("ListGroupComponent");
    
    const { editor, box }: FreComponentProps<PartWrapperBox> = $props();

    // Props - use $derived to properly react to box changes
    let cssClass = $derived(box?.findParam("cssClass") || "");
    let canAdd = $derived(box?.findParam("canAdd") === "true");
    let canCRUD = $derived(box?.findParam("canCRUD") === "true");
    let canExpand = $derived(box?.findParam("canExpand") === "true");
    // Store the language-defined default so we can restore it later
    let defaultIsExpanded = $derived(box?.findParam("isExpanded") === "true");
    let isExpanded = $state(false);
    // Content display value - directly controlled $state for reliable reactivity
    let contentDisplay = $state('none');
    let label = $derived(box?.findParam("label") || "");

    let id = $derived(box ? componentId(box) : 'group-for-unknown-box');
    
    // Initialize isExpanded and contentDisplay from defaultIsExpanded
    $effect(() => {
        if (defaultIsExpanded !== undefined) {
            isExpanded = defaultIsExpanded;
            contentDisplay = defaultIsExpanded ? 'block' : 'none';
        }
    });
    let contentElement: HTMLDivElement | undefined = $state();
    let toggleButton: HTMLButtonElement | undefined = $state();

    // Get the count of items in the list
    let itemCount = $derived(() => {
        try {
            const items = box?.getPropertyValue();
            if (Array.isArray(items)) {
                return items.length;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    });

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.

    async function setFocus(): Promise<void> {
        // list group has no editable element, but does have a selectable child
        // set to none if there is no expandable child
        if (canExpand && toggleButton) {
            toggleButton?.focus();
        }
    }

    const refresh = (why?: string): void => {
        LOGGER.log("REFRESH (" + why + ")");
        box.childBox?.refreshComponent(why);
    };

    onMount(() => {
        box.refreshComponent = refresh; 
        box.setFocus = setFocus;
        box.selectable = false;
        const childBox = box.childBox;
        if (childBox) {
            childBox.cssClass = cssClass;
        }
    });

    // Subscribe to expand/collapse all commands
    const unsubscribe = expandCollapseStore.subscribe((cmd) => {
        if (cmd && canExpand) {
            let newExpandedState = isExpanded;
            if (cmd.command === 'expand') {
                newExpandedState = true;
            } else if (cmd.command === 'collapse') {
                newExpandedState = false;
            } else if (cmd.command === 'default') {
                // Restore to the language-defined default state
                newExpandedState = defaultIsExpanded;
            }
            // Update state
            isExpanded = newExpandedState;
            box.isExpanded = newExpandedState;
            contentDisplay = newExpandedState ? 'block' : 'none';
            
            // Direct DOM manipulation as fallback
            if (contentElement) {
                contentElement.style.display = newExpandedState ? 'block' : 'none';
            }
        }
    });

    onDestroy(() => {
        unsubscribe();
    });

    // Replaces afterUpdate()
    $effect(() => {
        box.refreshComponent = refresh;
    });

    const toggleExpanded = (event: MouseEvent | KeyboardEvent) => {
        isExpanded = !isExpanded;
        box.isExpanded = isExpanded;
        contentDisplay = isExpanded ? 'block' : 'none';
        event.stopPropagation();
        event.preventDefault();
    };

    const addItem = (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        // Expand the component if it's collapsed
        if (canExpand && !isExpanded) {
            isExpanded = true;
            box.isExpanded = true;
            contentDisplay = 'block';
        }
        AST.change(() => {
            const language = FreLanguage.getInstance();
            const propertyName = box.propertyName;
            const node = box.node;
            const typeName = node.freLanguageConcept();
            const property = language.classifierProperty(typeName, propertyName);
            let newConceptName = "";
            if (!property) {
                LOGGER.error(`Cannot find property '${propertyName}' on classifier '${typeName}'`);
                return;
            }
            if (property.type) {
                newConceptName = property.type;
                if (newConceptName.startsWith('Abstract')) {
                    newConceptName = newConceptName.slice(8);
                } else if (newConceptName === "EventTask") { // HACK: Needed because of the multiple kinds of tasks
                    newConceptName = "Task";
                }
                const newElement = language.concept(newConceptName)?.creator({});
                (box.getPropertyValue() as unknown as FreNode[]).push(newElement);
                LOGGER.log("Added item: " + newConceptName);
             } else {
                LOGGER.error("Cannot add item " + newConceptName);
            }
        });
    }

    // Check if this list supports paste-to-create-multiple
    // Controlled via canPasteMultiple="true" parameter in editor definition
    let canPasteMultiple = $derived(box?.findParam("canPasteMultiple") === "true" && canAdd);

    // Debug: log parameter values
    $effect(() => {
        const pasteParam = box?.findParam("canPasteMultiple");
        if (box?.propertyName === "tasks") {
            LOGGER.log(`canPasteMultiple check for ${box?.propertyName}: param="${pasteParam}", canAdd=${canAdd}, result=${canPasteMultiple}`);
        }
    });

    const pasteItems = async (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        try {
            // Read from clipboard
            const clipboardText = await navigator.clipboard.readText();
            if (!clipboardText || clipboardText.trim().length === 0) {
                LOGGER.log("Clipboard is empty");
                showPasteError("Clipboard Empty", "The clipboard is empty. Copy some text (one item per line) and try again.");
                return;
            }

            // Split by various line break characters (handles PDF, Windows, Unix, old Mac, and Unicode separators)
            // \r\n = Windows, \n = Unix, \r = old Mac, \v = vertical tab, \f = form feed
            // \u2028 = line separator, \u2029 = paragraph separator
            const lines = clipboardText.split(/\r\n|\n|\r|\v|\f|\u2028|\u2029/).map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length === 0) {
                LOGGER.log("No valid lines to paste");
                showPasteError("No Valid Content", "The clipboard doesn't contain any valid lines of text. Make sure you have text with one item per line.");
                return;
            }

            // Expand the component if it's collapsed
            if (canExpand && !isExpanded) {
                isExpanded = true;
                box.isExpanded = true;
                contentDisplay = 'block';
            }

            AST.change(() => {
                const language = FreLanguage.getInstance();
                const propertyName = box.propertyName;
                const node = box.node;
                const typeName = node.freLanguageConcept();
                const property = language.classifierProperty(typeName, propertyName);

                if (!property) {
                    LOGGER.error(`Cannot find property '${propertyName}' on classifier '${typeName}'`);
                    return;
                }

                if (property.type) {
                    let newConceptName = property.type;
                    if (newConceptName.startsWith('Abstract')) {
                        newConceptName = newConceptName.slice(8);
                    } else if (newConceptName === "EventTask") {
                        newConceptName = "Task";
                    }

                    const conceptInfo = language.concept(newConceptName);
                    if (!conceptInfo) {
                        LOGGER.error(`Cannot find concept '${newConceptName}'`);
                        return;
                    }

                    const list = box.getPropertyValue() as unknown as FreNode[];

                    // Get existing names to prevent duplicates
                    const existingNames = new Set<string>();
                    for (const item of list) {
                        if ('name' in item && typeof (item as any).name === 'string') {
                            existingNames.add((item as any).name.toLowerCase());
                        }
                    }

                    let addedCount = 0;
                    const skippedItems: string[] = [];

                    // Create an item for each line, skipping duplicates
                    for (const line of lines) {
                        const lowerLine = line.toLowerCase();
                        if (existingNames.has(lowerLine)) {
                            LOGGER.log("Skipping duplicate: " + line);
                            skippedItems.push(line);
                            continue;
                        }

                        const newElement = conceptInfo.creator({});
                        // Set the name property if it exists
                        if ('name' in newElement) {
                            (newElement as any).name = line;
                        }
                        list.push(newElement);
                        existingNames.add(lowerLine); // Track newly added names too
                        addedCount++;
                        LOGGER.log("Added item from paste: " + line);
                    }

                    LOGGER.log(`Pasted ${addedCount} items, skipped ${skippedItems.length} duplicates`);

                    // Show dialog if there were duplicates
                    if (skippedItems.length > 0) {
                        showPasteDuplicatesReport(addedCount, skippedItems);
                    }
                } else {
                    LOGGER.error("Cannot add items - no type info");
                }
            });
        } catch (err) {
            LOGGER.error("Failed to read clipboard: " + err);
            // Check if it's a permission error or unsupported content
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (errorMessage.includes("permission") || errorMessage.includes("denied")) {
                showPasteError("Clipboard Access Denied", "Unable to access the clipboard. Please grant clipboard permissions to this application.");
            } else {
                showPasteError("Paste Failed", "Unable to read clipboard content. The clipboard may contain non-text content (like images or rich text) that cannot be pasted here.");
            }
        }
    }

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="{id}" class="list-group {cssClass}">
    {#if canExpand}
        <button class="btn-icon p-0 ml-1 mr-1 toggle-button" bind:this={toggleButton} onclick={toggleExpanded} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), toggleExpanded(e))} title={isExpanded ? "Collapse" : "Expand"} tabindex="0">
            {#if isExpanded}
                <IconChevronDown size={16} />
            {:else}
                <IconChevronRight size={16} />
            {/if}
        </button>
    {:else}
        <span class="w-5"></span>   
    {/if}
    <span class="list-group-label">{label} {#if canAdd}({itemCount()}){/if}</span>
    {#if canAdd}
        <button class="circle-button action-button" onclick={addItem} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(e))} title="Add" tabindex="0">
            <IconPlus size={14} />
        </button>
    {/if}
    {#if canPasteMultiple}
        <button class="circle-button action-button" onclick={pasteItems} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), pasteItems(e))} title="Paste multiple items from clipboard (one per line)" tabindex="0">
            <IconClipboardPaste size={14} />
        </button>
    {/if}
    {#if canCRUD}
        <button class="circle-button action-button" title="More..." tabindex="0">
            <IconEllipsisVertical size={14} />
        </button> 
    {/if}
</div>
<div class="list-group-content {cssClass}" bind:this={contentElement} style:display={contentDisplay}>
    <RenderComponent box={box.childBox} {editor} {cssClass} />
</div>
