import { Box } from "../Box.js";
import { FreNode, FreNodeReference } from "../../../ast/index.js";
import { FreUtils } from "../../../util/index.js";
import { AbstractExternalPropertyBox } from "./AbstractExternalPropertyBox.js";

/**
 * This class represents an external component that replaces the native projection of a list of references, like "reference notes: NoteConcept[]".
 */
export class ExternalRefListBox extends AbstractExternalPropertyBox {
    readonly kind: string = "ExternalRefListBox";
    private _children: Box[] = [];

    constructor(
        externalComponentName: string,
        node: FreNode,
        role: string,
        propertyName: string,
        children: Box[],
        initializer?: Partial<ExternalRefListBox>,
    ) {
        super(externalComponentName, node, role, propertyName);
        FreUtils.initializeObject(this, initializer);
        children.forEach((b) => this.addChildNoDirty(b));
    }

    /**
     * To be used when adding multiple children in one go, avoiding spurious isDirty() calls.
     * @param child
     * @private
     */
    private addChildNoDirty(child: Box | null) {
        if (!!child) {
            this._children.push(child);
            child.parent = this;
        }
    }

    get children(): ReadonlyArray<Box> {
        return this._children as ReadonlyArray<Box>;
    }

    getPropertyValue(): FreNodeReference<any>[] {
        return this.node[this.propertyName];
    }
}

export function isExternalRefListBox(b: Box): b is ExternalRefListBox {
    return b?.kind === "ExternalRefListBox"; // b instanceof ExternalRefListBox;
}
