import { FreUtils } from "../../util/index.js";
import { FreNode } from "../../ast/index.js";
import { Box } from "./Box.js";
import { IconDefinition, faQuestion } from '@fortawesome/free-solid-svg-icons';

export class IconBox extends Box {
    readonly kind = "IconBox";

    iconDef: IconDefinition = faQuestion;
    cursorStyle: string = "default";

    constructor(node: FreNode, role: string, iconDef: IconDefinition, cursorStyle?: string, initializer?: Partial<IconBox>) {
        super(node, role);
        FreUtils.initializeObject(this, initializer);
        this.iconDef = iconDef;
        this.cursorStyle = cursorStyle;
        this.selectable = false;
    }
}

export function isIconBox(box: Box): box is IconBox {
    return box?.kind === "IconBox";
}
