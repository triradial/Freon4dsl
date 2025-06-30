<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { componentId, executeCustomKeyboardShortCut } from "./svelte-utils/index.js";
    import { ALT, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, ARROW_UP, BACKSPACE, CONTROL, DELETE, ENTER, ESCAPE, SHIFT, TAB } from '@freon4dsl/core';
    import { ActionBox,  isActionBox, isActionTextBox, isSelectBox, ItemGroupBox, FreCaret, FreCaretPosition, FreLogger, FreErrorSeverity, isRegExp, triggerTypeToString, CharAllowed } from "@freon4dsl/core";
    import type { FrePostAction } from "@freon4dsl/core";
    import type { ItemGroupProps } from './svelte-utils/FreComponentProps.js';
    import RenderComponent from "./RenderComponent.svelte";
    import { runInAction } from "mobx";
    import { replaceHTML } from "./svelte-utils/index.js";
    import { contextMenu } from './stores/AllStores.svelte.js';
    /* ts-ignore */
    import { ChevronDown as IconChevronDown,  ChevronRight as IconChevronRight,  EllipsisVertical as IconEllipsisVertical,  Share2 as IconShare2,  Link2Off as IconUnlink,  Copy as IconDuplicate,  Trash2 as IconTrash2 } from '@lucide/svelte';      


    // TODO find out better way to handle muting/unmuting of LOGGERs
    const LOGGER = new FreLogger("ItemGroupComponent"); // .mute(); muting done through webapp/logging/LoggerSettings
    const dispatcher = createEventDispatcher();
    type BoxType = "action" | "select" | "text";

    // Props
    let { 
        box,
        editor,
        isEditing: initialIsEditing = false,
        partOfActionBox,
        text,
        cssClass,
        canDelete,
        canUnlink,
        canExpand,
        canShare,
        canCRUD,
        canDuplicate,
        isRequired,
        isExpanded: initialIsExpanded = false
     }: ItemGroupProps<ItemGroupBox> = $props();

    // Local variables
    let id: string = $state(!!box ? componentId(box) : "texitemgroup-with-unknown-box");
    let spanElement: HTMLSpanElement | undefined = $state();
    let inputElement: HTMLInputElement | undefined = $state();
    let placeholder: string = $state(box?.placeHolder ?? "<..>");
    let originalText: string = $state("");
    let editStart = $state(false);
    let from = $state(-1);
    let to = $state(-1);
    let style: string = $state("");
    let contentElement: HTMLDivElement | null = $state(null);
    let isEditing = $state(initialIsEditing);
    let isExpanded = $state(initialIsExpanded);
    let contentStyle = $derived(isExpanded ? "display:block;" : "display:none;");

    // Note that 'from <= to' always holds.
    let placeHolderStyle = $derived(() => partOfActionBox ? "text-component-action-placeholder" : "text-component-placeholder");
    let boxType = $derived(() => !!box.parent ? (isActionBox(box?.parent) ? "action" : isSelectBox(box?.parent) ? "select" : "text") : "text");

    onMount(() => {
        if (!!box) {
            originalText = text = box.getText();
            setInputWidth();
            box.setFocus = setFocus;
            box.setCaret = setCaret;
            box.refreshComponent = refresh;
        }
    });

    $effect(() => {
        box.refreshComponent = refresh;
    });

    /**
     * This function sets the focus on this element programmatically.
     * It is called from the box.
     */
    export async function setFocus(): Promise<void> {
        if (!!inputElement) {
            inputElement.focus();
            inputElement.select();
        } else {
            // set the local variables, then the inputElement will be shown
            isEditing = true;
            editStart = true;
            originalText = text;
            setCaret(editor.selectedCaretPosition);
        }
    }

    /**
     * This function ensures that 'from <= to' always holds.
     * Should be called whenever these variables are set.
     * @param inFrom
     * @param inTo
     */
    function setFromAndTo(inFrom: number, inTo: number) {
        if (inFrom < inTo) {
            from = inFrom;
            to = inTo;
        } else {
            from = inTo;
            to = inFrom;
        }
    }

    /**
     * This function sets the caret position of the <input> element programmatically.
     * It is called from setFocus, so indirectly by the editor.
     * @param freCaret
     */
    const setCaret = (freCaret: FreCaret) => {
        switch (freCaret.position) {
            case FreCaretPosition.RIGHT_MOST: // type nr 2
                from = to = text.length;
                break;
            case FreCaretPosition.LEFT_MOST: // type nr 1
            case FreCaretPosition.UNSPECIFIED: // type nr 0
                from = to = 0;
                break;
            case FreCaretPosition.INDEX: // type nr 3
                setFromAndTo(freCaret.from, freCaret.to);
                break;
            default:
                from = to = 0;
                break;
        }
        if (isEditing && !!inputElement) {
            inputElement.selectionStart = from >= 0 ? from : 0;
            inputElement.selectionEnd = to >= 0 ? to : 0;
            inputElement.focus();
        }
    };

    /**
     * When the switch is made from <span> to <input> this function is called.
     * It stores the caret position(s) to be used to set the selection of the <input>,
     * and sets the selectedBox of the editor.
     */
    function startEditing(event: MouseEvent) {
        if (box.canEdit) {
            LOGGER.log("startEditing " + id);
            editor.selectElementForBox(box);
            isEditing = true;
            if (typeof window !== 'undefined') {
                console.debug('[ItemGroupComponent] isEditing set to', isEditing, 'in startEditing');
                if (window.__FREON_DEBUG_TRACE__) {
                    console.trace('[ItemGroupComponent] isEditing set to', isEditing, 'in startEditing');
                }
            }
            editStart = true;
            originalText = text;
            let { anchorOffset, focusOffset } = document.getSelection() || { anchorOffset: 0, focusOffset: 0 };
            setFromAndTo(anchorOffset, focusOffset);
        }
        event.preventDefault();
        event.stopPropagation();
        if (box.canEdit) {
            dispatcher("startEditing", { content: text, caret: from });
        }
    }

    /**
     * This function is only called when the <input> element is shown. Then clicks should not be propagated.
     * (Clicks either resize the element or set the caret position.)
     * When this component is part of a TextDropdown Component, the dropdown options should also be altered.
     * @param event
     */
    function onClick(event: MouseEvent) {
        if (!!inputElement) {
            setFromAndTo(inputElement.selectionStart || 0, inputElement.selectionEnd || 0);
        }
        if (partOfActionBox) {
            dispatcher("textUpdate", { content: text, caret: from });
        }
        event.stopPropagation();
    }

    /**
     * When the <input> element loses focus the function is called. It switches the display back to
     * the <span> element, and stores the current text in the textbox.
     */
    function endEditing() {
        LOGGER.log(" endEditing " + id);
        if (isEditing) {
            // reset the local variables
            isEditing = false;
            if (typeof window !== 'undefined') {
                console.debug('[ItemGroupComponent] isEditing set to', isEditing, 'in endEditing');
                if (window.__FREON_DEBUG_TRACE__) {
                    console.trace('[ItemGroupComponent] isEditing set to', isEditing, 'in endEditing');
                }
            }
            from = -1;
            to = -1;

            if (!partOfActionBox) {
                // store the current value in the textbox, or delete the box, if appropriate
                runInAction(() => {
                    if (box.deleteWhenEmpty && text.length === 0) {
                        editor.deleteBox(box);
                    } else if (text !== box.getText()) {
                        LOGGER.log(`   text is new value`);
                        box.setText(text);
                    }
                });
            } else {
                dispatcher("endEditing");
            }
        }
    }

    /**
     * When a keyboard event is triggered, this function stores the caret position(s).
     * Note, this function is to be used from the <input> element only. It depends on the
     * fact that the event target has a 'selectionStart' and a 'selectionEnd', which is the case
     * only for <textarea> or <input> elements.
     * @param event
     */
    function getCaretPosition(event: KeyboardEvent) {
        const target = event.target as HTMLInputElement;
        setFromAndTo(target.selectionStart ?? 0, target.selectionEnd ?? 0);
    }

    /**
     * This function handles any keyboard event that occurs within the <input> element.
     * Note, we use onKeyDown, because onKeyPress is deprecated.
     * @param event
     */
    const onKeyDown = (event: KeyboardEvent) => {
        if (event.altKey || event.ctrlKey) {
            executeCustomKeyboardShortCut(event, 0, box, editor);
            if (event.ctrlKey && !event.altKey && event.key === "z") {
                // ctrl-z
                // UNDO handled by browser
            } else if ((event.ctrlKey && event.altKey && event.key === "z") || (!event.ctrlKey && event.altKey && event.key === BACKSPACE)) {
                // ctrl-alt-z or alt-backspace
                // REDO handled by browser
            } else if (event.ctrlKey && !event.altKey && event.key === "h") {
                // ctrl-h
                // SEARCH
                event.stopPropagation();
            } else if (event.ctrlKey && !event.altKey && event.key === "x") {
                // ctrl-x
                // CUT
                event.stopPropagation();
            } else if (event.ctrlKey && !event.altKey && event.key === "c") {
                // ctrl-c
                // COPY
                event.stopPropagation();
                navigator.clipboard
                    .writeText(text)
                    .then(() => {
                        editor.setUserMessage("Text copied to clipboard", FreErrorSeverity.Info);
                    })
                    .catch((err) => {
                        editor.setUserMessage("Error in copying text: " + err.message);
                    });
            } else if (event.ctrlKey && !event.altKey && event.key === "v") {
                // ctrl-v
                // PASTE
                event.stopPropagation();
                event.preventDefault();
            } else if (event.key === SHIFT || event.key === CONTROL || event.key === ALT) {
                LOGGER.log("SHIFT: stop propagation");
                event.stopPropagation();
            }
        } else {
            switch (event.key) {
                case ARROW_DOWN:
                case ARROW_UP:
                case ENTER:
                case ESCAPE:
                case TAB: {
                    LOGGER.log("Arrow up, arrow down, enter, escape, or tab pressed: " + event.key);
                    break;
                }
                case ARROW_LEFT: {
                    getCaretPosition(event);
                    LOGGER.log("Arrow-left: Caret at: " + from);
                    if (from !== 0) {
                        event.stopPropagation();
                        LOGGER.log("dispatching from arrow-left");
                        dispatcher("textUpdate", { content: text, caret: from - 1 });
                    } else {
                        endEditing();
                    }
                    break;
                }
                case ARROW_RIGHT: {
                    getCaretPosition(event);
                    LOGGER.log("Arrow-right: Caret at: " + from);
                    if (from !== text.length) {
                        event.stopPropagation();
                        LOGGER.log("dispatching from arrow-right");
                        dispatcher("textUpdate", { content: text, caret: from + 1 });
                    } else {
                        endEditing();
                    }
                    break;
                }
                case BACKSPACE: {
                    if (!event.ctrlKey && event.altKey && !event.shiftKey) {
                        // alt-backspace
                        // TODO UNDO
                    } else if (!event.ctrlKey && event.altKey && event.shiftKey) {
                        // alt-shift-backspace
                        // TODO REDO
                    } else {
                        getCaretPosition(event);
                        LOGGER.log("Caret at: " + from);
                        if (from !== 0) {
                            event.stopPropagation();
                        } else if (text === "" || !!text) {
                            if (box.deleteWhenEmptyAndErase) {
                                editor.deleteBox(box);
                                event.stopPropagation();
                                return;
                            }
                            editor.selectPreviousLeaf();
                        } else {
                            endEditing();
                            editor.selectPreviousLeaf();
                        }
                    }
                    break;
                }
                case DELETE: {
                    if (!event.ctrlKey && !event.altKey && event.shiftKey) {
                        // shift-delete
                        // CUT
                    } else {
                        event.stopPropagation();
                        getCaretPosition(event);
                        if (to !== text.length) {
                            event.stopPropagation();
                        } else if (text === "" || !text) {
                            if (box.deleteWhenEmptyAndErase) {
                                editor.deleteBox(box);
                                return;
                            } else {
                                endEditing();
                                editor.selectNextLeaf();
                            }
                        }
                    }
                    break;
                }
                default: {
                    getCaretPosition(event);
                    switch (box.isCharAllowed(text, event.key, from)) {
                        case CharAllowed.OK:
                            event.stopPropagation();
                            if (editor.selectedBox.kind === "ActionBox") {
                                const matchingOption = (editor.selectedBox as ActionBox).getOptions(editor).find((option: { action: { trigger: RegExp } }) => {
                                    if (isRegExp(option.action.trigger)) {
                                        if (option.action.trigger.test(event.key)) {
                                            LOGGER.log("Matching regexp" + triggerTypeToString(option.action.trigger));
                                            return true;
                                        }
                                        return false;
                                    }
                                });
                                if (!!matchingOption) {
                                    let execresult: FrePostAction = null;
                                    runInAction(() => {
                                        runInAction(() => {
                                            const command = matchingOption.action.command();
                                            execresult = command.execute(box, event.key, editor, 0);
                                        });
                                        if (!!execresult) {
                                            execresult();
                                        }
                                    });
                                    event.preventDefault();
                                    event.stopPropagation();
                                }
                            }
                            break;
                        case CharAllowed.NOT_OK:
                            LOGGER.log("KeyPressAction.NOT_OK");
                            event.preventDefault();
                            event.stopPropagation();
                            break;
                        case CharAllowed.GOTO_NEXT:
                            LOGGER.log("KeyPressAction.GOTO_NEXT");
                            if (from === 0) {
                                editor.selectNextLeaf();
                            } else if (to === text.length) {
                                editor.selectPreviousLeaf();
                            } else {
                                // todo break the textbox in two, if possible
                            }
                            LOGGER.log("    NEXT LEAF IS " + editor.selectedBox.role);
                            if (isActionTextBox(editor.selectedBox)) {
                                LOGGER.log("     is an action box");
                                (editor.selectedBox.parent as ActionBox).triggerKeyPressEvent(event.key);
                            } else {
                                LOGGER.log("     is NOT an action box");
                            }
                            event.preventDefault();
                            event.stopPropagation();
                            break;
                    }
                }
            }
        }
    };

    /**
     * When this component loses focus, do everything that is needed to end the editing state.
     */
    const onFocusOut = () => {
        if (!partOfActionBox && isEditing) {
            endEditing();
        } else {
            dispatcher("onFocusOutText");
        }
    };

    const refresh = () => {
        placeholder = box.placeHolder;
        if (!isEditing) {
            text = box.getText();
        }
        setInputWidth();
        cssClass = box.cssClass;
    };

    $effect(() => {
        if (editStart && !!inputElement) {
            inputElement.selectionStart = from >= 0 ? from : 0;
            inputElement.selectionEnd = to >= 0 ? to : 0;
            setInputWidth();
            inputElement.focus();
            editStart = false;
        }
        if (isEditing && partOfActionBox) {
            if (text !== originalText) {
                dispatcher("textUpdate", { content: text, caret: from + 1 });
            }
        }
        setInputWidth();
        placeholder = box.placeHolder;
        box.setFocus = setFocus;
        box.setCaret = setCaret;
        box.refreshComponent = refresh;
    });

    function setInputWidth() {
        if (!!widthSpan && !!inputElement) {
            let value = inputElement.value;
            if (value !== undefined && value !== null && value.length === 0) {
                value = placeholder;
                if (placeholder.length === 0) {
                    value = " ";
                }
            }
            widthSpan.innerHTML = replaceHTML(value);
            const width = widthSpan.offsetWidth + 2 + "px";
            inputElement.style.width = width;
        }
    }

    function onDragStart(event: DragEvent) {
        event.stopPropagation();
        event.preventDefault();
    }

    let widthSpan: HTMLSpanElement | null = $state(null);

    function onInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        setInputWidth();
    }

    refresh();

    const selectItem = (event: MouseEvent | KeyboardEvent) => {
        editor.selectElementForBox(box);
        event.preventDefault();
        event.stopPropagation();
    };

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            selectItem(event);
        }
    }

    const toggleExpanded = (event: MouseEvent) => {
        isExpanded = !isExpanded;
        box.isExpanded = isExpanded;
        event.stopPropagation();
    };

    function shareItem() {
        box.executeAction(editor, "make-shareable");
    }

    function deleteItem() {
        box.executeAction(editor, "delete");
    }

    function duplicateItem() {
        box.executeAction(editor, "duplicate");
    }

    function onContextMenu(event: MouseEvent) {
        event.preventDefault();
        dispatcher("contextmenu", { event, box, editor });
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events a11y_interactive_supports_focus -->
<div id="{id}-group" class="item-group {cssClass} w-full" {style} onclick={selectItem} onkeydown={handleKeydown} oncontextmenu={onContextMenu} role="button" tabindex="0">
    {#if canExpand}
        <button class="btn-icon p-0 ml-1 toggle-button" onclick={toggleExpanded}>
            {#if isExpanded}
                <IconChevronDown size={16} />
            {:else}
                <IconChevronRight size={16} />
            {/if}
        </button>
    {:else}
        <span class="w-5"></span>
    {/if}
    <span class="item-group-label">{box.getLabel()}</span>
    <span {id} onclick={onClick} role="none">
        {#if isEditing}
            <span {id}>
                <input
                    type="text"
                    class="text-component-input"
                    id="{id}-input"
                    bind:this={inputElement}
                    oninput={onInput}
                    bind:value={text}
                    onfocusout={onFocusOut}
                    onkeydown={onKeyDown}
                    draggable="true"
                    ondragstart={onDragStart}
                    {placeholder}
                />
                <span class="text-component-width" bind:this={widthSpan}></span>
            </span>
        {:else}
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
            <span
                class="{box.role} text-box-{boxType} text-component-text"
                onclick={startEditing}
                bind:this={spanElement}
                contenteditable="true"
                spellcheck="false"
                id="{id}-span"
                role="none"
            >
                {#if !!text && text.length > 0}
                    {text}{#if canUnlink}<IconDuplicate size={16} />{/if}
                {:else}
                    <span class="{placeHolderStyle} {isRequired ? 'required' : ''}">{placeholder}</span>
                {/if}
            </span>
        {/if}
    </span>
    {#if canCRUD}
        <button class="circle-button action-button" onclick={shareItem} title="More...">
            <IconEllipsisVertical size={14} />
        </button>
    {/if}
    {#if canShare}
        <button class="circle-button action-button" onclick={shareItem} title="Share">
            <IconShare2 size={14} />
        </button>
    {/if}
    {#if canUnlink}
        <button class="circle-button action-button" onclick={shareItem} title="Unlink">
            <IconUnlink size={14} />
        </button>
    {/if}
    {#if canDuplicate}
        <button class="circle-button action-button" onclick={duplicateItem} title="Duplicate">
            <IconDuplicate size={14} />
        </button>
    {/if}
    {#if canDelete}
        <button class="circle-button action-button" onclick={deleteItem} title="Delete">
            <IconTrash2 size={14} />
        </button>
    {/if}
</div>
{#key contentStyle}
    <div bind:this={contentElement} style={contentStyle}>
        <RenderComponent box={box.child} {editor} {cssClass} />
    </div>
{/key}
