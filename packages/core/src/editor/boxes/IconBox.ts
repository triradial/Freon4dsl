import { FreUtils } from "../../util/index.js";
import type { FreNode } from "../../ast/index.js";
import { Box } from "./Box.js";

export class IconBox extends Box {
    readonly kind = "IconBox";

    iconDef: any = null;
    cursorStyle: string = "default";

    constructor(node: FreNode, role: string, iconDef: any, cursorStyle?: string, initializer?: Partial<IconBox>) {
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
