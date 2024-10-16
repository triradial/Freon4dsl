import { Box } from "../Box.js";
import { FreNode } from "../../../ast/index.js";
import { FreUtils } from "../../../util/index.js";
import { AbstractPropertyWrapperBox } from "./AbstractPropertyWrapperBox.js";

/**
 * This class represents an external component that replaces the native projection of a list of model properties, like "notes: NoteConcept[]".
 */
export class PartWrapperBox extends AbstractPropertyWrapperBox {
    readonly kind: string = "PartWrapperBox";

    constructor(
        externalComponentName: string,
        node: FreNode,
        role: string,
        propertyName: string,
        childBox: Box,
        initializer?: Partial<PartWrapperBox>,
    ) {
        super(externalComponentName, node, role, propertyName, childBox);
        FreUtils.initializeObject(this, initializer);
    }

    getPropertyValue(): FreNode {
        return this.node[this.propertyName];
    }
}

export function isPartWrapperBox(b: Box): b is PartWrapperBox {
    return b?.kind === "PartWrapperBox"; // b instanceof PartWrapperBox;
}
