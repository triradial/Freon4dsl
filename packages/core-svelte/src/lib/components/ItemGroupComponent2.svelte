<script lang="ts">
    // unused import 30-JUn import { isNumber } from 'lodash';
    import TextComponent from './TextComponent.svelte';
    import DropdownComponent from './DropdownComponent.svelte';
    import { clickOutsideConditional, componentId } from './svelte-utils/index.js';
    import {
        type ItemGroupBox2,
        ARROW_DOWN,
        ARROW_UP,
        ENTER,
        ESCAPE,
        isSelectBox,
        FreEditor,
        FreLogger,
        Box,
        type SelectOption,
        TextBox,
        isRegExp,
        triggerTypeToString,
        isActionBox,
        type FrePostAction,
        FreCaretPosition,
        FreCaret
    } from '@freon4dsl/core';
    import RenderComponent from './RenderComponent.svelte';
    import {
        GripVertical as IconGripVertical,
        ChevronDown as IconChevronDown,
        ChevronRight as IconChevronRight,
        EllipsisVertical as IconEllipsisVertical,
        Trash2 as IconTrash2,
        Unlink as IconUnlink
    } from '@lucide/svelte';
    import { runInAction } from 'mobx';
    import { onMount } from 'svelte';

    // TODO find out better way to handle muting/unmuting of LOGGERs
    const LOGGER = new FreLogger('ItemGroupComponent2');

    // Props
    let { 
        box, 
        editor,
        cssClass,
        canDelete,
        canUnlink,
        canExpand
    }: ItemGroup2Props<ItemGroupBox2> = $props();
    let textBox: TextBox = $derived(() => box?.textBox);

    let id: string = $state(!!box ? componentId(box) : 'itemgroup2-with-unknown-box');
    let isEditing: boolean = $state(false); // becomes true when the text field gets focus
    let dropdownShown: boolean = $state(false); // when true the dropdwon element is shown
    let text: string = $state(''); // the text in the text field
    let selected: string = $state(''); // the id of the selected option in the dropdown
    let filteredOptions: SelectOption[] = $state([]); // the list of filtered options that are shown in the dropdown
    let allOptions: SelectOption[] = $state([]); // all options as calculated by the editor
    let textComponent: any = $state();
    let style: string = $state('');

    let contentElement: HTMLDivElement | null = $state(null);
    let label: string = $state('');
    let child: Box = $state();
    let isExpanded: boolean = $state(false);
    let contentStyle: string = $state('display: none');
    let isDraggable: boolean = $state(true);
    let canEdit: boolean = $state(true);

    let setText = (value: string) => {
        if (value === null || value === undefined) {
            text = '';
        } else {
            text = value;
        }
    };

    const noOptionsId = 'noOptions'; // constant for when the editor has no options
    let getOptions = (): SelectOption[] => {
        // the function used to calculate all_options, called by onClick and setFocus
        let result = box?.getOptions(editor);
        if (result === null || result === undefined) {
            result = [{ id: noOptionsId, label: '<no known options>' }];
        }
        return result;
    };

    /**
     * This function sets the focus on this element programmatically.
     * It is called from the RenderComponent.
     */
    const setFocus = () => {
        // LOGGER.log("setFocus " + box.kind + id);
        if (!!textComponent) {
            textComponent.setFocus();
        } else {
            console.error('TextDropdownComponent2 ' + id + ' has no textComponent');
        }
    };

    /**
     * This function is executed whenever there is a change in the box model.
     * It sets the text in the box, if this is a SelectBox.
     */
    const refresh = (why?: string) => {
        // LOGGER.log("refresh: " + why)
        if (isSelectBox(box)) {
            // TODO see todo in 'storeOrExecute'
            // let selectedOption = box.getSelectedOption();
            // if (!!selectedOption) {
            //     box.textHelper.setText(selectedOption.label);
            //     setText(box.textHelper.getText());
            // }
        }
        cssClass = box.cssClass;
        label = box.getLabel();
        child = box?.child;
        canDelete = box.canDelete;
        canUnlink = box.canUnlink;
        canExpand = box.canExpand;
        // because the box maybe a different one than we started with ...
        // box.setFocus = setFocus; todo remove?
    };

    $effect(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
        box.triggerKeyPressEvent = triggerKeyPressEvent;
    });

    onMount(() => {
        // LOGGER.log("onMount for role [" + box.role + "]");
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
        box.triggerKeyPressEvent = triggerKeyPressEvent;
    });

    $effect(() => {
        box.refreshComponent = refresh;
    });

    const triggerKeyPressEvent = (key: string) => {
        textUpdateFunction({ content: key, caret: 1 });
        box.textHelper.setText(key);
    };

    // TODO still not functioning: reference shortcuts and chars that are not valid in textComponent to drop in next action!!!
    const textUpdateFunction = (data: { content: string; caret: number }): boolean => {
        LOGGER.log(`textUpdateFunction for ${box.kind}: ` + JSON.stringify(data));
        dropdownShown = true;
        allOptions = getOptions();
        filteredOptions = allOptions.filter((o) => o.label.startsWith(data.content));
        makeUnique();
        LOGGER.log(`FilteredOptions are ${filteredOptions.map((o) => o.label)}`);
        return false;
    };

    /**
     * This custom event is triggered when the text in the textComponent is altered or when the
     * caret position is changed.
     * Based on the (altered) text and the caret position within the text, the list of options
     * in the dropdownComponent is changed.
     * @param event
     */
    const textUpdate = (event: CustomEvent) => {
        LOGGER.log(`textUpdate for ${box.kind}: ` + JSON.stringify(event.detail));
        dropdownShown = true;
        allOptions = getOptions();
        filteredOptions = allOptions.filter((o) => o.label.startsWith(text));
        makeUnique();
    };

    function makeUnique() {
        // make doubles unique, to avoid errors
        const seen: string[] = [];
        const result: SelectOption[] = [];
        filteredOptions.forEach((option) => {
            if (seen.includes(option.label)) {
                LOGGER.log('Option ' + JSON.stringify(option) + ' is a duplicate');
            } else {
                seen.push(option.label);
                result.push(option);
            }
        });
        filteredOptions = result;
    }

    function selectLastOption() {
        if (dropdownShown) {
            if (filteredOptions?.length !== 0) {
                selected = filteredOptions[filteredOptions.length - 1].id;
            } else {
                // there are no valid options left
                editor.setUserMessage('no valid selection');
            }
        }
    }

    function selectFirstOption() {
        if (dropdownShown) {
            if (filteredOptions?.length !== 0) {
                selected = filteredOptions[0].id;
            } else {
                // there are no valid options left
                editor.setUserMessage('No valid selection');
            }
        }
    }

    /**
     * These events are either not handled by the textComponent, or not handled by the dropdownComponent.
     * In case of an arrow down or up event in the textComponent, the currently selected option in the dropdown is changed.
     * In case of an Enter event in the dropdown, the currently selected option in the dropdown is set as text in the
     * textComponent, and the editing state is ended.
     * In case of an ESCAPE in the textComponent, the dropdown is closed, while the editing state remains.
     * @param event
     */
    const onKeyDown = (event: KeyboardEvent) => {
        LOGGER.log(
            'onKeyDown: ' +
                id +
                ' [' +
                event.key +
                '] alt [' +
                event.altKey +
                '] shift [' +
                event.shiftKey +
                '] ctrl [' +
                event.ctrlKey +
                '] meta [' +
                event.metaKey +
                ']' +
                ', selected: ' +
                selected +
                ' dropdown:' +
                dropdownShown +
                ' editing:' +
                isEditing
        );
        if (dropdownShown) {
            if (!event.ctrlKey && !event.altKey) {
                switch (event.key) {
                    case ESCAPE: {
                        dropdownShown = false;
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                    case ARROW_DOWN: {
                        if (dropdownShown) {
                            if (!selected || selected.length == 0) {
                                // there is no current selection: start at the first option
                                selectFirstOption();
                            } else {
                                const index = filteredOptions.findIndex((o) => o.id === selected);
                                if (index + 1 < filteredOptions.length) {
                                    // the 'normal' case: go one down
                                    selected = filteredOptions[index + 1].id;
                                } else if (index + 1 === filteredOptions.length) {
                                    // the end of the options reached: go to the first
                                    selectFirstOption();
                                }
                            }
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        break;
                    }
                    case ARROW_UP: {
                        if (dropdownShown) {
                            if (!selected || selected.length == 0) {
                                // there is no current selection, start at the last option
                                selectLastOption();
                            } else {
                                const index = filteredOptions.findIndex((o) => o.id === selected);
                                if (index > 0) {
                                    // the 'normal' case: go one up
                                    selected = filteredOptions[index - 1].id;
                                } else if (index === 0) {
                                    // the beginning of the options reached: go to the last
                                    selectLastOption();
                                }
                            }
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        break;
                    }
                    case ENTER: {
                        // user wants current selection
                        // find the chosen option
                        let chosenOption: SelectOption = null;
                        if (filteredOptions.length <= 1) {
                            if (filteredOptions.length !== 0) {
                                // if there is just one option left, choose that one
                                chosenOption = filteredOptions[0];
                            } else {
                                // there are no valid options left
                                editor.setUserMessage('No valid selection');
                            }
                        } else {
                            // find the selected option and choose that one
                            const index = filteredOptions.findIndex((o) => o.id === selected);
                            if (index >= 0 && index < filteredOptions.length) {
                                chosenOption = filteredOptions[index];
                            }
                        }
                        // store or execute the option
                        if (!!chosenOption) {
                            storeAndExecute(chosenOption);
                        } else {
                            //  no valid option, restore the original text
                            setText(textBox.getText());
                            // stop editing
                            isEditing = false;
                            dropdownShown = false;
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                    default: {
                        // stop editing todo is this the correct default?
                        isEditing = false;
                        dropdownShown = false;
                    }
                }
            }
        } else {
            // this component was selected using keystrokes, not by clicking, therefore dropDownShown = false
            if (!event.ctrlKey && !event.altKey) {
                switch (event.key) {
                    case ENTER: {
                        startEditing();
                        event.stopPropagation();
                        event.preventDefault();
                    }
                }
            }
        }
    };

    function clearText() {
        // todo find out whether we can do without this textHelper
        LOGGER.log(
            `clearText for ${id} from text '${text}' & boxtext '${box.textHelper.getText()}' `
        );
        box.textHelper.setText('');
        // setText("");
    }

    /**
     * This custom event is triggered by a click in the dropdown. The option that is clicked
     * is set as text in the textComponent and the editing state is ended.
     */
    const itemSelected = () => {
        LOGGER.log('itemSelected ' + selected);
        const index = filteredOptions.findIndex((o) => o.id === selected);
        if (index >= 0 && index < filteredOptions.length) {
            const chosenOption = filteredOptions[index];
            if (!!chosenOption) {
                storeAndExecute(chosenOption);
            }
        }
        isEditing = false;
        dropdownShown = false;
    };

    /**
     * This custom event is triggered when the TextComponent gets focus by click.
     * The editor is notified of the newly selected box and the options list is filled.
     */
    const startEditing = (event?: CustomEvent) => {
        LOGGER.log('TextDropdownComponent: startEditing' + JSON.stringify(event?.detail));
        isEditing = true;
        dropdownShown = true;
        editor.selectElementForBox(box);
        allOptions = getOptions();
        if (!!event) {
            if (text === undefined || text === null) {
                filteredOptions = allOptions.filter((o) => true);
            } else {
                filteredOptions = allOptions.filter((o) => {
                    //LOGGER.log(`startsWith text [${text}], option is ${JSON.stringify(o)}`);
                    //return o?.label?.startsWith(text.substring(0, event.detail.caret))
                    return o?.label?.startsWith(text);
                });
            }
        } else {
            filteredOptions = allOptions.filter((o) => o?.label?.startsWith(text.substring(0, 0)));
        }
        makeUnique();
    };

    /**
     * When the user has selected an option, in whatever manner, this function is called.
     * The action that is associated with the option is executed. This changes the model,
     * thus it triggers the creation of a new box model. The 'refresh' function is triggered
     * by these changes.
     * @param selected
     */
    function storeAndExecute(selected: SelectOption) {
        LOGGER.log('executing option ' + selected.label);
        isEditing = false;
        dropdownShown = false;
        if (isActionBox(box)) {
            clearText();
        }
        runInAction(() => {
            // TODO set the new cursor through the editor
            box.selectOption(editor, selected); // TODO the result of the execution is ignored

            // TODO the execution of the option should set the text in the selectBox, for now this is handled here
            // if (isSelectBox(box)) {
            setText(selected.label);
            // } else {
            //     // ActionBox, action done, clear input text
            //     clearText();
            // }
        });
    }

    /**
     * This function is called whenever the user ends editing the TextComponent,
     * in whatever manner. It checks whether the current selected option/text is
     * a valid option. If so, this option is executed, else the text is set to the
     * original value.
     */
    const endEditing = () => {
        LOGGER.log(
            'endEditing ' + id + ' dropdownShow:' + dropdownShown + ' isEditing: ' + isEditing
        );
        if (isEditing === true) {
            isEditing = false;
        } else {
            if (dropdownShown === true) {
                dropdownShown = false;
            }
            return;
        }
        if (dropdownShown) {
            allOptions = getOptions();
            let validOption = allOptions.find((o) => o.label === text);
            if (!!validOption && validOption.id !== noOptionsId) {
                storeAndExecute(validOption);
            } else {
                // no valid option, restore the previous value
                setText(textBox.getText());
            }
            dropdownShown = false;
        }
    };

    const onBlur = () => {
        LOGGER.log('onBlur ' + id);
        if (!document.hasFocus()) {
            endEditing();
        }
    };

    const onFocusOutText = () => {
        LOGGER.log(`onFocusOutText ${id} text '${text}'`);
        if (isEditing) {
            isEditing = false;
        }
    };

    const onClickOutside = () => {
        LOGGER.log('onClickOutside');
        endEditing();
    };

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

    function toggleExpanded() {
        if (contentElement) {
            contentElement.style.display =
                contentElement.style.display === 'block' ? 'none' : 'block';
        }
        isExpanded = !isExpanded;
        contentStyle = isExpanded ? 'display:block;' : 'display:none;';
    }

    function shareItem() {
        box.executeAction(editor, 'make-shareable');
    }

    function unlinkItem() {
        box.executeAction(editor, 'unlink');
    }

    function deleteItem() {
        box.executeAction(editor, 'delete');
    }

    function onTextKeyDown(event: Event): void {
        const keyboardEvent = event as KeyboardEvent;
        onKeyDown(keyboardEvent);
    }

    // Svelte 5: TextComponent event handler
    function fromInner(eventType: string, details?: any) {
        switch (eventType) {
            case 'startEditing':
                startEditing(details);
                break;
            case 'endEditing':
                endEditing();
                break;
            case 'textUpdate':
                textUpdate(details);
                break;
            case 'focusOutTextComponent':
                onFocusOutText();
                break;
        }
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events a11y_interactive_supports_focus -->
<div
    id="{id}-group"
    class="item-group {cssClass} w-full"
    {style}
    onclick={selectItem}
    onkeydown={handleKeydown}
    role="button"
    tabindex="0">
    {#key isDraggable}
        <IconGripVertical />
    {/key}
    {#key isExpanded}
        {#if canExpand}
            <button
                class="btn btn-sm preset-filled toggle-button ml-1 h-7 w-4 p-0"
                onclick={toggleExpanded}
            >
                {#if isExpanded}
                    <IconChevronDown />
                {:else}
                    <IconChevronRight />
                {/if}
            </button>
        {:else}
            <span class="w-5"></span>
        {/if}
    {/key}
    <span class="item-group-label">{label}</span>

    <span
        {id}
        use:clickOutsideConditional={{ enabled: dropdownShown }}
        onclick_outside={onClickOutside}
        onblur={onBlur}
        oncontextmenu={() => endEditing()}
        class="text-dropdown-component"
        role="none"
    >
        <TextComponent
            {editor}
            cssClass={textBox?.cssClass}
            box={textBox}
            partOfDropdown={true}
            bind:isEditing
            bind:text
            bind:this={textComponent}
            toParent={fromInner}
        />
        {#if dropdownShown}
            <DropdownComponent
                bind:selected
                bind:options={filteredOptions}
                selectionChanged={itemSelected}
            />
        {/if}
    </span>
    {#if canUnlink}
        <button class="btn-icon action-button p-0" onclick={unlinkItem}>
            <IconUnlink size={16} />
        </button>
    {/if}
    {#if canDelete}
        <button class="btn-icon action-button p-0" onclick={deleteItem}>
            <IconTrash2 size={16} />
        </button>
    {/if}
</div>
{#key contentStyle}
    <div bind:this={contentElement} style={contentStyle}>
        <RenderComponent box={child} {editor} cssClass={child?.cssClass} />
    </div>
{/key}

