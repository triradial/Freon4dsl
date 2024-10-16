import { autorun } from "mobx";
import { AST } from "../../change-manager/index.js";
import { FreUtils } from "../../util/index.js";
import { FreCaret, FreCaretPosition } from "../util/index.js";
import { FreNode } from "../../ast/index.js";
import { Box } from "./Box.js";
import { FreLogger } from "../../logging/index.js";
import { CharAllowed } from "./CharAllowed.js";

const LOGGER: FreLogger = new FreLogger("TextBox");

export class TextBox extends Box {
    kind: string = "TextBox";
    /**
     * If true, the element will be deleted when the text becomes
     * empty because of removing the last character in the text.
     * Usable for e.g. numeric values.
     */
    deleteWhenEmpty: boolean = false;

    /**
     * If true, delete element when Erase (delete, backspace, etc.) key is pressed while the element is empty.
     */
    deleteWhenEmptyAndErase: boolean = false;

    // If true, then this box should carry all error messages on the line.
    isFirstInLine: boolean = false;

    placeHolder: string = "";
    caretPosition: number = -1;
    $_getText: () => string;
    $setText: (newValue: string) => void;

    /**
     * Run the setText() as defined by the user of this box inside a mobx action.
     * @param newValue
     */
    setText(newValue: string): void {
        LOGGER.log("setText to " + newValue);
        AST.changeNamed("TextBox.setText", () => {
            this.$setText(newValue);
        })
        this.isDirty();
    }

    getText(): string {
        return this.$_getText();
    }
    
    set $getText( value: () => string ) {
        const oldvalue = this.$_getText()
        this.$_getText = value;
        autorun( () => {
            const newvalue = this.$_getText()
            LOGGER.log(`old '${oldvalue}'  new '${newvalue}'`)
            this.isDirty()
        })
    }

    isCharAllowed: (currentText: string, key: string, index: number) => CharAllowed = () => {
        return CharAllowed.OK;
    };

    constructor(
        node: FreNode,
        role: string,
        getText: () => string,
        setText: (text: string) => void,
        initializer?: Partial<TextBox>,
    ) {
        super(node, role);
        FreUtils.initializeObject(this, initializer);
        this.$_getText = getText;
        this.$setText = setText;
    }



    // INTERNAL FUNCTIONS

    /** @internal
     */
    setCaret: (caret: FreCaret) => void = (caret: FreCaret) => {
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
    update: () => void = () => {
        /* To be overwritten by `TextComponent` */
    };

    isEditable(): boolean {
        return true;
    }
}

export function isTextBox(b: Box): b is TextBox {
    return !!b && b.kind === "TextBox"; // b instanceof TextBox;
}
