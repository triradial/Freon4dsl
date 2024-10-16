import { Box } from "../Box.js";
import { FreNode, FreNodeReference } from "../../../ast/index.js";
import { FreUtils } from "../../../util/index.js";
import { AbstractPropertyWrapperBox } from "./AbstractPropertyWrapperBox.js";

/**
 * This class represents an external component that replaces the native projection of a list of model properties, like "notes: NoteConcept[]".
 */
export class RefWrapperBox extends AbstractPropertyWrapperBox {
    readonly kind: string = "RefWrapperBox";

    constructor(
        externalComponentName: string,
        node: FreNode,
        role: string,
        propertyName: string,
        childBox: Box,
        initializer?: Partial<RefWrapperBox>,
    ) {
        super(externalComponentName, node, role, propertyName, childBox);
        FreUtils.initializeObject(this, initializer);
    }

    getPropertyValue(): FreNodeReference<any> {
        const val = this.node[this.propertyName];
        // if (typeof val === this.propertyClassifierName) {
        return val;
        // }
        // return undefined;
    }
}

export function isRefWrapperBox(b: Box): b is RefWrapperBox {
    return b?.kind === "RefWrapperBox"; // b instanceof RefWrapperBox;
}
