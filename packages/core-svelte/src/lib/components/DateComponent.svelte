<!-- This component switches between a <span> and an <input> HTML element. -->
<!-- This means that there is extra functionality to set the caret position -->
<!-- (cursor or selected text), when the switch is being made. -->

<script lang="ts">
	import { onMount } from "svelte";
	import { componentId, executeCustomKeyboardShortCut } from "./svelte-utils/index.js";
	import { ActionBox, ALT, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, ARROW_UP, BACKSPACE, CONTROL, DELETE, ENTER, ESCAPE, isActionBox, isSelectBox, FreCaret, FreCaretPosition, FreEditor, FreLogger, SelectBox, FreErrorSeverity, SHIFT, TAB, DateBox, isRegExp, triggerTypeToString, type FrePostAction } from "@freon4dsl/core";
	import { CharAllowed} from "@freon4dsl/core";
	import { DatePicker } from "bits-ui";
	import { type DateValue } from "@internationalized/date";
	import { runInAction } from "mobx";
	import { replaceHTML } from "./svelte-utils/index.js";


	// TODO find out better way to handle muting/unmuting of LOGGERs
    const LOGGER = new FreLogger("DateComponent"); // .mute(); muting done through webapp/logging/LoggerSettings

    // Parameters
    export let box: DateBox;				// the accompanying textbox
    export let editor: FreEditor;			// the editor
	export let isEditing: boolean = false; 	// indication whether this component is currently being edited by the user, needs to be exported for binding in TextDropdownComponent
	export let text: string;    			// the text to be displayed

    // Local variables
    let id: string = $state(!!box ? componentId(box) : 'text-with-unknown-box');
    let spanElement: HTMLSpanElement | null = $state(null);
    let inputElement: HTMLInputElement | null = $state(null);
    let placeholder: string = $state('<..>');
    let originalText: string = $state('');
    let editStart: boolean = $state(false);
    let from: number = $state(-1);
    let to: number = $state(-1);
	let cssClass: string = $state('');
	let placeHolderStyle: string = $state('datecomponent-placeholder');
	let dateValue: DateValue | undefined = $state(undefined);

    /**
     * This function sets the focus on this element programmatically.
     * It is called from the box.
     */
	export async function setFocus(): Promise<void> {
		LOGGER.log("setFocus "+ id + " input is there: " + !!inputElement);
		if (!!inputElement) {
			inputElement.focus();
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
		LOGGER.log(`setCaret ${freCaret.position} [${freCaret.from}, ${freCaret.to}]` );
        switch (freCaret.position) {
            case FreCaretPosition.RIGHT_MOST:  // type nr 2
                from = to = text.length;
                break;
            case FreCaretPosition.LEFT_MOST:   // type nr 1
            case FreCaretPosition.UNSPECIFIED: // type nr 0
                from = to = 0;
                break;
            case FreCaretPosition.INDEX:       // type nr 3
				setFromAndTo(freCaret.from, freCaret.to);
				break;
            default:
				from = to = 0;
                break;
        }
        if (isEditing && inputElement) {
			const input = inputElement as HTMLInputElement;
			input.selectionStart = from >= 0 ? from : 0;
			input.selectionEnd = to >= 0 ? to : 0;
			input.focus();
		}
    };

    /**
     * When the switch is made from <span> to <input> this function is called.
     * It stores the caret position(s) to be used to set the selection of the <input>,
     * and sets the selectedBox of the editor.
     */
    function startEditing(event: MouseEvent) {
        LOGGER.log('startEditing ' + id);
        // set the global selection
        editor.selectElementForBox(box);
        // set the local variables
        isEditing = true;
        editStart = true;
        originalText = text;
        const selection = document.getSelection();
        if (selection) {
            const range = selection.getRangeAt(0);
            setFromAndTo(range.startOffset, range.endOffset);
        }
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * This function is only called when the <input> element is shown. Then clicks should not be propagated.
     * (Clicks either resize the element or set the caret position.)
     * When this component is part of a TextDropdown Component, the dropdown options should also be altered.
     * @param event
     */
    function onClick(event: MouseEvent) {
		if (inputElement) {
			LOGGER.log('onClick: ' + id + ', ' + inputElement?.selectionStart + ", " + inputElement?.selectionEnd);
			setFromAndTo(inputElement.selectionStart ?? 0, inputElement.selectionEnd ?? 0);
		}
        event.stopPropagation();
    }

    /**
     * When the <input> element loses focus the function is called. It switches the display back to
     * the <span> element, and stores the current text in the textbox.
     */
    function endEditing() {
        LOGGER.log(' endEditing ' + id);
		if (isEditing) {
			// reset the local variables
			isEditing = false;
			from = -1;
			to = -1;

			// store the current value in the textbox, or delete the box, if appropriate
			LOGGER.log(`   save text using box.setDate(${text})`)
			runInAction(() => {
				if (box.deleteWhenEmpty && text.length === 0) {
					editor.deleteBox(box);
				} else if (text !== box.getDate()) {
					LOGGER.log(`   text is new value`)
					box.setDate(text);
				}
			});
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
        // see https://en.wikipedia.org/wiki/Table_of_keyboard_shortcuts
        // stopPropagation on an element will stop that event from happening on the parent (the entire ancestors),
        // preventDefault on an element will stop the event on the element, but it will happen on it's parent (and the ancestors too!)
        LOGGER.log("onKeyDown: [" + event.key + "] alt [" + event.altKey + "] shift [" + event.shiftKey + "] ctrl [" + event.ctrlKey + "] meta [" + event.metaKey + "]");

		if (event.altKey || event.ctrlKey) {  // No shift, because that is handled as normal text
			// first check if this event has a command defined for it
			executeCustomKeyboardShortCut(event, 0, box, editor); // this method will stop the event from propagating, but does not prevent default!!
			// next handle any key that should have a special effect within the text
			if (event.ctrlKey && !event.altKey && event.key === 'z') { // ctrl-z
				// UNDO handled by browser
			} else if (event.ctrlKey && event.altKey && event.key === 'z' || !event.ctrlKey && event.altKey && event.key === BACKSPACE) { // ctrl-alt-z or alt-backspace
				// REDO handled by browser
			} else if (event.ctrlKey && !event.altKey && event.key === 'h') { // ctrl-h
				// SEARCH
				event.stopPropagation();
			} else if (event.ctrlKey && !event.altKey && event.key === 'x') { // ctrl-x
				// CUT
				event.stopPropagation();
			} else if (event.ctrlKey && !event.altKey && event.key === 'c') { // ctrl-c
				// COPY
				event.stopPropagation();
				navigator.clipboard.writeText(text) // TODO get only the selected text from document.getSelection
						.then(() => {
							editor.setUserMessage('Text copied to clipboard', FreErrorSeverity.Info);
						})
						.catch(err => {
							editor.setUserMessage('Error in copying text: ' + err.message);
						});
			} else if (event.ctrlKey && !event.altKey && event.key === 'v') { // ctrl-v
				// PASTE
				event.stopPropagation();
				event.preventDefault(); // the default event causes extra <span> elements to be added

				// clipboard.readText does not work in Firefox
				// Firefox only supports reading the clipboard in browser extensions, using the "clipboardRead" extension permission.
				// TODO add a check on the browser used
				// navigator.clipboard.readText().then(
				// 		clipText => LOGGER.log('adding ' + clipText + ' after ' + text[to - 1]));
				// TODO add the clipText to 'text'
			} else if (event.key === SHIFT || event.key === CONTROL || event.key === ALT) { // ignore meta keys
				LOGGER.log("SHIFT: stop propagation")
				event.stopPropagation();
			}
		} else { // handle non meta keys
			switch (event.key) {
				case ARROW_DOWN:
				case ARROW_UP:
				case ENTER:
				case ESCAPE:
				case TAB: {
					// todo Maybe this option could be completely handled by TextDropDown and Freon,
					// this would avoid a second call to endEditing when the selection is changed.
					LOGGER.log("Arrow up, arrow down, enter, escape, or tab pressed: " + event.key);
					if (isEditing) {
						endEditing();
					}
					break;
				}
				case ARROW_LEFT: {
					getCaretPosition(event);
					LOGGER.log("Arrow-left: Caret at: " + from);
					if (from !== 0) { // when the arrow key can stay within the text, do not let the parent handle it
						event.stopPropagation();
					} else { // the key will cause this element to lose focus, its content should be saved
						endEditing();
					}
					break;
				}
				case ARROW_RIGHT: {
					getCaretPosition(event);
					LOGGER.log("Arrow-right: Caret at: " + from);
					if (from !== text.length) { // when the arrow key can stay within the text, do not let the parent handle it
						event.stopPropagation();
					} else { // the key will cause this element to lose focus, its content should be saved
						endEditing();
						// let the parent take care of handling the event
					}
					break;
				}
				case BACKSPACE: {
					if (!event.ctrlKey && event.altKey && !event.shiftKey) { // alt-backspace
						// TODO UNDO
					} else if (!event.ctrlKey && event.altKey && event.shiftKey) { // alt-shift-backspace
						// TODO REDO
					} else { // backspace
						getCaretPosition(event);
						LOGGER.log("Caret at: " + from);
						if (from !== 0) { // When there are still chars remaining to the left, do not let the parent handle it.
							// Without propagation, the browser handles which char(s) to be deleted.
							// With event.ctrlKey: delete text from caret to end => handled by browser.
							event.stopPropagation();
						} else if (text === "" || !!text) { // nothing left in this component to delete
							if (box.deleteWhenEmptyAndErase) {
								editor.deleteBox(box);
								event.stopPropagation();
								return;
							}
							editor.selectPreviousLeaf();
						} else {
							// the key will cause this element to lose focus, its content should be saved
							endEditing();
							editor.selectPreviousLeaf();
						}
					}
					break;
				}
				case DELETE: {
					if (!event.ctrlKey && !event.altKey && event.shiftKey) { // shift-delete
						// CUT
					} else { // delete
						event.stopPropagation();
						getCaretPosition(event);
						if (to !== text.length) { // when there are still chars remaining to the right, do not let the parent handle it
							// without propagation, the browser handles which char(s) to be deleted
							// with event.ctrlKey: delete text from caret to 0 => handled by browser
							event.stopPropagation();
						} else if (text === "" || !text) { //  nothing left in this component to delete
							if (box.deleteWhenEmptyAndErase) {
								editor.deleteBox(box);
								return;
							} else { // TODO is this correct?
								// the key will cause this element to lose focus, its content should be saved
								endEditing();
								editor.selectNextLeaf();
							}
						}
					}
					break;
				}
				default: { // the event.key is SHIFT or a printable character
					getCaretPosition(event);
					switch (box.isCharAllowed(text, event.key, from)) {
						case CharAllowed.OK: // add to text, handled by browser
							LOGGER.log('CharAllowed');
							event.stopPropagation();
							break;
						case CharAllowed.NOT_OK: // ignore
							// ignore any spaces in the text TODO make this depend on textbox.spaceAllowed
							LOGGER.log("KeyPressAction.NOT_OK");
							event.preventDefault();
							event.stopPropagation();
							break;
						case CharAllowed.GOTO_NEXT: // try in previous or next box
							LOGGER.log("KeyPressAction.GOTO_NEXT");
							if (from === 0) {
								editor.selectNextLeaf();
							} else if (to === text.length) {
								editor.selectPreviousLeaf();
							} else {
								// todo break the textbox in two, if possible
							}
							LOGGER.log("    NEXT LEAF IS " + editor.selectedBox.role);
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
	const onFocusOut = (e: FocusEvent) => {
		LOGGER.log("onFocusOut " + id + " isEditing:" + isEditing)
		if (isEditing) {
			endEditing();
		}
	}

	const refresh = () => {
		LOGGER.log("REFRESH " + box?.element?.freId() + " (" + box?.element?.freLanguageConcept() + ")")
		placeholder = box.placeHolder;
		// If being edited, do not set the value, let the user type whatever (s)he wants
		if (!isEditing) {
			text = box.getDate();
		}
		setInputWidth();
		cssClass = box.cssClass;
	}

	/**
	 * When setting the focus programmatically, the 'inputElement' variable is not immediately set.
	 * It may be null or undefined! Therefore, we need this check to set the focus.
 	 */
	// beforeUpdate(() => {
	// 	if (editStart && !!inputElement) {
	// 		LOGGER.log('Before update : ' + id + ", " + inputElement);
	// 		setInputWidth();
	// 		inputElement.focus();
	// 		editStart = false;
	// 	}
	// });

    /**
     * When the HTML is updated, and the switch is made from <span> to <input>,
     * this function sets the caret position(s) on the <input>.
     * Note that 'from <= to' always holds.
     * When the switch from <input> to <span> is made, this function sets the
     * box sizes in the textbox.
     */
	 $effect(() => {
        // LOGGER.log("Start afterUpdate  " + from + ", " + to + " id: " + id);
		if (editStart && inputElement) {
			LOGGER.log('    editStart in afterupdate for ' + id)
			const input = inputElement as HTMLInputElement;
			input.selectionStart = from >= 0 ? from : 0;
			input.selectionEnd = to >= 0 ? to : 0;
			setInputWidth();
			input.focus();
			editStart = false;
		}
		// Always set the input width explicitly.
		setInputWidth();
		placeholder = box.placeHolder
		box.setFocus = setFocus;
		box.setCaret = setCaret;
		box.refreshComponent = refresh;
	});

    /**
     * When this component is mounted, the setFocus and setCaret functions are
     * made available to the textbox, and the 'text' and 'originalText' variables
     * are set.
     */
    onMount(() => {
        LOGGER.log("onMount" + " for element "  + box?.element?.freId() + " (" + box?.element?.freLanguageConcept() + ")");
        originalText = text = box.getDate();
		placeholder = box.placeHolder;
		setInputWidth();
		box.setFocus = setFocus;
		box.setCaret = setCaret;
		box.refreshComponent = refresh;
    });

	/**
	 * Sets the inputwidth to match the text inside.
	 * Copy text from <input> into the <span> with position = absolute and takes the rendered span width.
	 * See https://dev.to/matrixersp/how-to-make-an-input-field-grow-shrink-as-you-type-513l
	 */
	function setInputWidth() {
		if(!!widthSpan && !!inputElement) {
			let value = inputElement.value;
			if ((value !== undefined) && (value !== null) && (value.length === 0)) {
				value = placeholder;
				if (placeholder.length === 0) {
					value = " ";
				}
			}
			// Ensure that HTML tags in value are encoded, otherwise they will be seen as HTML.
			widthSpan.innerHTML = replaceHTML(value);
			const width = widthSpan.offsetWidth + 2 + "px";
			inputElement.style.width = width;
			// LOGGER.log("setInputWidth mirror [" + value + "] input [" + inputElement.value + "] placeholder [" + placeholder + "] w: " + width + " " + widthSpan.clientWidth + " for element "  + box?.element?.freId() + " (" + box?.element?.freLanguageConcept() + ")")
		} else {
			// LOGGER.log("SetInputWidth do nothing for element " + box?.element?.freId() + " (" + box?.element?.freLanguageConcept() + ") " + widthSpan + "::" + inputElement + "::" + spanElement);
		}
	}

	/**
	 * Often a TextComponent is part of a list, to prevent the list capturing the drag start event, (which should actually
	 * select (part of) the text in the input element), this function is defined.
	 * Note that if the input element is not defined as 'draggable="true"', this function will never be called.
	 * @param event
	 */
	function onDragStart(event: DragEvent) {
		LOGGER.log('on drag start');
		event.stopPropagation();
		event.preventDefault();
	}

	let widthSpan: HTMLSpanElement;

	function onInput(event: InputEvent & { currentTarget: HTMLInputElement }) {
		setInputWidth();
	}

	function onDateSelect(value: DateValue | undefined) {
		if (value) {
			text = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
			endEditing();
		}
	}

	refresh();
</script>

<!-- todo there is a double selection here: two borders are showing -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
<span id="{id}" onclick={onClick} role="none" class="{cssClass}">
	{#if isEditing}
		<span id="{id}">
			<DatePicker.Root
				onValueChange={onDateSelect}
				bind:value={dateValue}
			>
				<DatePicker.Input class="h-input rounded-input border-border-input bg-background text-foreground focus-within:border-border-input-hover focus-within:shadow-date-field-focus hover:border-border-input-hover flex w-full select-none items-center border px-2 py-3 text-sm tracking-[0.01em]">
					{#snippet children({ segments })}
						{#each segments as { part, value }, i (part + i)}
							<div class="inline-block select-none">
								{#if part === "literal"}
									<DatePicker.Segment {part} class="text-muted-foreground p-1">
										{value}
									</DatePicker.Segment>
								{:else}
									<DatePicker.Segment
										{part}
										class="rounded-5px hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1"
									>
										{value}
									</DatePicker.Segment>
								{/if}
							</div>
						{/each}
					{/snippet}
				</DatePicker.Input>
				<DatePicker.Content sideOffset={6} class="z-50">
					<DatePicker.Calendar class="border-dark-10 bg-background-alt shadow-popover rounded-[15px] border p-[22px]">
						{#snippet children({ months, weekdays })}
							<DatePicker.Header class="flex items-center justify-between">
								<DatePicker.PrevButton class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]" />
								<DatePicker.Heading class="text-[15px] font-medium" />
								<DatePicker.NextButton class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]" />
							</DatePicker.Header>
							<div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
								{#each months as month (month.value)}
									<DatePicker.Grid class="w-full border-collapse select-none space-y-1">
										<DatePicker.GridHead>
											<DatePicker.GridRow class="mb-1 flex w-full justify-between">
												{#each weekdays as day (day)}
													<DatePicker.HeadCell class="text-muted-foreground font-normal! w-10 rounded-md text-xs">
														<div>{day.slice(0, 2)}</div>
													</DatePicker.HeadCell>
												{/each}
											</DatePicker.GridRow>
										</DatePicker.GridHead>
										<DatePicker.GridBody>
											{#each month.weeks as weekDates (weekDates)}
												<DatePicker.GridRow class="flex w-full">
													{#each weekDates as date (date)}
														<DatePicker.Cell {date} month={month.value} class="p-0! relative size-10 text-center text-sm">
															<DatePicker.Day class="rounded-9px text-foreground hover:border-foreground data-selected:bg-foreground data-disabled:text-foreground/30 data-selected:text-background data-unavailable:text-muted-foreground data-disabled:pointer-events-none data-outside-month:pointer-events-none data-selected:font-medium data-unavailable:line-through group relative inline-flex size-10 items-center justify-center whitespace-nowrap border border-transparent bg-transparent p-0 text-sm font-normal transition-all">
																<div class="bg-foreground group-data-selected:bg-background group-data-today:block absolute top-[5px] hidden size-1 rounded-full transition-all"></div>
																{date.day}
															</DatePicker.Day>
														</DatePicker.Cell>
													{/each}
												</DatePicker.GridRow>
											{/each}
										</DatePicker.GridBody>
									</DatePicker.Grid>
								{/each}
							</div>
						{/snippet}
					</DatePicker.Calendar>
				</DatePicker.Content>
			</DatePicker.Root>
			<span class="datecomponent-inputttext datecomponent-width" bind:this={widthSpan}></span>
		</span>
	{:else}
		<!-- contenteditable must be true, otherwise there is no cursor position in the span after a click,
		     But ... this is only a problem when this component is inside a draggable element (like List or table)
		-->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
		<span class="{box.role} date-box datecomponent-text"
              onclick={startEditing}
              bind:this={spanElement}
			  contenteditable=true
			  spellcheck=false
              id="{id}-span"
			  role="none">
			{#if !!text && text.length > 0}
				{text}
			{:else}
				<span class="{placeHolderStyle}">{placeholder}</span>
			{/if}
		</span>
	{/if}
</span>
