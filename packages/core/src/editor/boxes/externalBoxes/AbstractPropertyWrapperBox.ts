import { AbstractExternalBox } from "./AbstractExternalBox.js";
import type { FreNode } from "../../../ast/index.js";
import { FreLanguage } from "../../../language/index.js";
import { Box } from "../Box.js";

export abstract class AbstractPropertyWrapperBox extends AbstractExternalBox {
    // the following two are inherit from Box
    // propertyName: string;       // the name of the property, if any, in 'element' which this box projects
    // propertyIndex: number;      // the index within the property, if appropriate
    propertyClassifierName: string = "unknown-type"; // the name of the type of the elements in the list
    private _childBox: Box; // todo mix this with .children from Box

    constructor(externalComponentName: string, node: FreNode, role: string, propertyName: string, childBox: Box) {
        super(externalComponentName, node, role);
        this.propertyName = propertyName;
        this._childBox = childBox;
        this.propertyClassifierName = FreLanguage.getInstance().classifierProperty(
            node.freLanguageConcept(),
            propertyName,
        )?.type;
    }

    getPropertyName(): string {
        return this.propertyName;
    }

    get childBox(): Box {
        return this._childBox;
    }

    get children(): ReadonlyArray<Box> {
        return [this._childBox] as ReadonlyArray<Box>;
    }

    /**
     * Override firstLeaf to return this wrapper box itself when selectable,
     * allowing external components to receive focus via keyboard navigation.
     */
    get firstLeaf(): Box | null {
        if (!this.isVisible) {
            return null;
        }
        if (this.selectable) {
            return this;
        }
        // Fall back to child if not selectable
        return this._childBox?.firstLeaf ?? null;
    }

    /**
     * Override lastLeaf to return this wrapper box itself when selectable.
     */
    get lastLeaf(): Box | null {
        if (!this.isVisible) {
            return null;
        }
        if (this.selectable) {
            return this;
        }
        // Fall back to child if not selectable
        return this._childBox?.lastLeaf ?? null;
    }
}
