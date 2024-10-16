import { AST } from "../../../change-manager/index.js";
import { Box } from "../Box.js";
import { FreNode } from "../../../ast/index.js";
import { FreUtils } from "../../../util/index.js";
import { AbstractExternalPropertyBox } from "./AbstractExternalPropertyBox.js";

/**
 * This class represent an external box replacing the native projection of a single property of primitive type.
 */
export class ExternalNumberBox extends AbstractExternalPropertyBox {
    readonly kind: string = "ExternalNumberBox";

    constructor(
        externalComponentName: string,
        node: FreNode,
        role: string,
        propertyName: string,
        initializer?: Partial<ExternalNumberBox>,
    ) {
        super(externalComponentName, node, role, propertyName);
        FreUtils.initializeObject(this, initializer);
    }

    getPropertyValue(): number | undefined {
        const val: number | undefined = this.node[this.propertyName];
        if (typeof val === "number") {
            return val;
        }
        return undefined;
    }

    setPropertyValue(newValue: number) {
        if (typeof newValue === "number" && this.getPropertyType() === "number") {
            AST.change(() => {
                this.node[this.propertyName] = newValue;
            });
        } else {
            console.log(
                "ExternalNumberBox.setPropertyValue type error: trying to set property of type " +
                    this.getPropertyType() +
                    " to a value of type " +
                    typeof newValue,
            );
        }
    }
}

export function isExternalNumberBox(b: Box): b is ExternalNumberBox {
    return b?.kind === "ExternalNumberBox"; // b instanceof ExternalNumberBox;
}
