import { TextComponentHelper } from '@freon4dsl/core-svelte';

export interface TextboxHelperOptions {
    getValue: () => string;
    setValue: (v: string) => void;
    inputElement?: HTMLInputElement;
    spanElement?: HTMLSpanElement;
    widthSpan?: HTMLSpanElement;
    placeholder?: string;
}

export default class TextboxHelper {
    private helper: TextComponentHelper;
    private getValue: () => string;
    private setValue: (v: string) => void;
    private inputElement?: HTMLInputElement;
    private spanElement?: HTMLSpanElement;
    private widthSpan?: HTMLSpanElement;
    private placeholder?: string;
    public from: number = -1;
    public to: number = -1;

    constructor(options: TextboxHelperOptions) {
        this.getValue = options.getValue;
        this.setValue = options.setValue;
        this.inputElement = options.inputElement;
        this.spanElement = options.spanElement;
        this.widthSpan = options.widthSpan;
        this.placeholder = options.placeholder;
        this.helper = new TextComponentHelper(
            undefined, // box (optional, not always needed)
            this.getValue,
            () => false, // change detection, can be customized
            () => {},    // end editing, can be customized
            undefined    // toParent, can be customized
        );
    }

    // Set the width of the input to match the span
    setInputWidth() {
        if (!!this.widthSpan && !!this.inputElement) {
            let value = this.inputElement.value;
            if (!value || value.length === 0) {
                value = this.placeholder || '';
                if (value.length === 0) value = '<enter>';
            }
            this.widthSpan.innerHTML = this.replaceHTML(value);
            const width = this.widthSpan.offsetWidth + 2 + 'px';
            this.inputElement.style.width = width;
        }
    }

    // Replace HTML tags and spaces with HTML Entities
    replaceHTML(s: string): string {
        return s.replace(/\s/g, '&nbsp;').replace(/</g, '&lt;');
    }

    // Set caret position in the input
    setCaret(from: number, to: number) {
        if (this.inputElement) {
            this.inputElement.selectionStart = from;
            this.inputElement.selectionEnd = to;
            this.inputElement.focus();
        }
        this.from = from;
        this.to = to;
    }

    // Get caret position from the input
    getCaretPosition() {
        if (this.inputElement) {
            this.from = this.inputElement.selectionStart ?? 0;
            this.to = this.inputElement.selectionEnd ?? 0;
        }
    }

    // Ensure from <= to
    setFromAndTo(inFrom: number, inTo: number) {
        if (inFrom < inTo) {
            this.from = inFrom;
            this.to = inTo;
        } else {
            this.from = inTo;
            this.to = inFrom;
        }
    }

    // Handle keydown events
    handleKeyDown(event: KeyboardEvent, value: string, setValue: (v: string) => void) {
        // Extend as needed for navigation, shortcuts, etc.
        this.getCaretPosition();
        // Example: handle left/right arrows
        if (event.key === 'ArrowLeft') {
            this.from = Math.max(0, (this.inputElement?.selectionStart ?? 0) - 1);
            this.setCaret(this.from, this.from);
        } else if (event.key === 'ArrowRight') {
            this.from = Math.min(value.length, (this.inputElement?.selectionEnd ?? 0) + 1);
            this.setCaret(this.from, this.from);
        }
        // Add more as needed
    }

    // Handle input event
    handleInput(event: Event) {
        this.setInputWidth();
        this.getCaretPosition();
    }

    // Handle focus event
    handleFocus() {
        this.setInputWidth();
    }

    // Handle blur event
    handleBlur() {
        // Optionally reset caret, etc.
    }
} 