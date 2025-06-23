import { FreUtils } from "../../util/index.js";
import { FreCaret, FreCaretPosition } from "../util/index.js";
import type { FreNode } from "../../ast/index.js";
import { Box } from "./Box.js";
import { FreLogger } from "../../logging/index.js";
import { CharAllowed } from "./CharAllowed.js";

const LOGGER: FreLogger = new FreLogger("TextBox");

export class ItemGroupBox extends Box {
    public kind: string = "ItemGroupBox";

    /**
     * If true, the element will be deleted when the text becomes
     * empty because of removing the last character in the text.
     * Usable for e.g. numeric values.
     */
    public deleteWhenEmpty: boolean = false;

    /**
     * If true, delete element when Erase key is pressed while the element is empty.
     */
    public deleteWhenEmptyAndErase: boolean = false;

    public placeHolder: string = "";
    public caretPosition: number = -1;
    private $getText: () => string;
    private $setText: (newValue: string) => void;
    private $label: string = "";
    private $child: Box = null;

    public isExpanded: boolean = false;
    public isDraggable: boolean = true;
    public isRequired: boolean = false;
    public canShare: boolean = false;
    public canDelete: boolean = false;
    public canUnlink: boolean = false;
    public canCRUD: boolean = false;
    public canEdit: boolean = true;
    public canDuplicate: boolean = false;
    public canExpand: boolean = true;

    constructor(node: FreNode, role: string, getLabel: string | (() => string), getText: () => string, setText: (text: string) => void, child: Box, initializer?: Partial<ItemGroupBox>) {
        super(node, role);
        FreUtils.initializeObject(this, initializer);
        this.$getText = getText;
        this.$setText = setText;
        this.setLabel(getLabel);
        this.$child = child;
    }

    /**
     * Run the setText() as defined by the user of this box inside a mobx action.
     * @param newValue
     */
    setText(newValue: string): void {
        LOGGER.log("setText to " + newValue);
        this.$setText(newValue);
        this.isDirty();
    }

    getText(): string {
        return this.$getText();
    }

    setLabel(getLabel: string | (() => string)) {
        if (typeof getLabel === "function") {
            if (this.getLabel !== getLabel) {
                this.getLabel = getLabel;
                this.isDirty();
            }
        } else if (typeof getLabel === "string") {
            if (this.$label !== getLabel) {
                this.$label = getLabel;
                this.isDirty();
            }
        } else {
            throw new Error("LabelBox: incorrect label type");
        }
    }

    getLabel(): string {
        return this.$label;
    }

    get child() {
        return this.$child;
    }

    set child(v: Box) {
        this.$child = v;
        this.$child.parent = this;
        this.isDirty();
    }

    public isCharAllowed: (currentText: string, key: string, index: number) => CharAllowed = () => {
        return CharAllowed.OK;
    };

    public deleteWhenEmpty1(): boolean {
        return this.deleteWhenEmpty;
    }

    // INTERNAL FUNCTIONS

    /** @internal
     */
    public setCaret: (caret: FreCaret) => void = (caret: FreCaret) => {
        LOGGER.log("setCaret: " + caret.position);
        /* To be overwritten by `TextComponent` */
        // TODO The followimng is needed to keep the cursor at the end when creating a nu8mberliteral in example
        //     Check in new components whether this is needed.
        switch (caret.position) {
            case FreCaretPosition.RIGHT_MOST:
                this.caretPosition = this.getText().length;
                break;
            case FreCaretPosition.LEFT_MOST:
                this.caretPosition = 0;
                break;
            case FreCaretPosition.INDEX:
                this.caretPosition = caret.position;
                break;
            case FreCaretPosition.UNSPECIFIED:
                break;
            default:
                break;
        }
    };

    /** @internal
     * This function is called after the text changes in the browser.
     * It ensures that the SelectableComponent will calculate the new coordinates.
     */
    public update: () => void = () => {
        /* To be overwritten by `TextComponent` */
    };

    public isEditable(): boolean {
        return true;
    }
}

export function isItemGroupBox(b: Box): b is ItemGroupBox {
    return !!b && b.kind === "ItemGroupBox";
}
