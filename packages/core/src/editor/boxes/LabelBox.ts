import { Box } from "./Box.js";
import { FreUtils } from "../../util/index.js";
import { FreNode } from "../../ast/index.js";

export class LabelBox extends Box {
    readonly kind: string = "LabelBox";

    private $label: string = "";

    constructor(node: FreNode, role: string, getLabel: string | (() => string), initializer?: Partial<LabelBox>, cssClass?: string) {
        super(node, role);
        this.selectable = false; // default
        FreUtils.initializeObject(this, initializer);
        this.setLabel(getLabel);
        this.cssClass = cssClass;
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
}

export function isLabelBox(b: Box): b is LabelBox {
    return b?.kind === "LabelBox"; // b instanceof LabelBox;
}
