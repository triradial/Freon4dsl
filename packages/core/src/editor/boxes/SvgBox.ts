import { FreUtils } from "../../util/index.js";
import { FreNode } from "../../ast/index.js";
import { Box } from "./Box.js";

export class SvgBox extends Box {
    readonly kind = "SvgBox";

    svgPath: string = "";
    viewPortWidth: number = 20;
    viewPortHeight: number = 20;
    viewBoxWidth: number = 20;
    viewBoxHeight: number = 20;

    constructor(node: FreNode, role: string, svgPath: string, initializer?: Partial<SvgBox>) {
        super(node, role);
        FreUtils.initializeObject(this, initializer);
        this.svgPath = svgPath;
        this.selectable = false;
    }
}

export function isSvgBox(box: Box): box is SvgBox {
    return box?.kind === "SvgBox";
}
