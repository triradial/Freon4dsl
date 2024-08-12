import { FreNode } from "../../ast/index";
import { FreUtils } from "../../util/index";
import { Box } from "./Box";
import { FreLogger } from "../../logging";

const LOGGER: FreLogger = new FreLogger("MultiLineTextBox2");

export class MultiLineTextBox2 extends Box {
    kind: string = "MultiLineTextBox2";
    placeHolder: string = "<enter>";
    $getText: () => string;
    $setText: (newValue: string) => void;
    $getRawText: () => string;
    rawText: string;

    constructor(node: FreNode, role: string, getText: () => string, setText: (text: string) => void, getRawText: () => string, initializer?: Partial<MultiLineTextBox2>) {
        super(node, role);
        FreUtils.initializeObject(this, initializer);
        this.$getText = getText;
        this.$setText = setText;
        this.$getRawText = getRawText;
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

    getRawText(): string {
        return this.rawText;
    }
    override isEditable(): boolean {
        return true;
    }
}

export function isMultiLineTextBox2(b: Box): b is MultiLineTextBox2 {
    return !!b && b.kind === "MultiLineTextBox2";
}
