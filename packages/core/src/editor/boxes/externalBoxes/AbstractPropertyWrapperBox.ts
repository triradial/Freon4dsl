import type { FreNode } from "../../../ast/index.js";
import { FreLanguage } from "../../../language/index.js";
import { FreUtils } from "../../../util/index.js";
import { Box } from "../Box.js";
import { AbstractExternalBox } from "./AbstractExternalBox.js";

export abstract class AbstractPropertyWrapperBox extends AbstractExternalBox {
    // the following two are inherit from Box
    // propertyName: string;       // the name of the property, if any, in 'element' which this box projects
    // propertyIndex: number;      // the index within the property, if appropriate
    propertyClassifierName: string = "unknown-type"; // the name of the type of the elements in the list
    private _childBox: Box; // todo mix this with .children from Box

    constructor(externalComponentName: string, node: FreNode, role: string, propertyName: string, childBox: Box, initializer?: Partial<AbstractPropertyWrapperBox>) {
        super(externalComponentName, node, role);
        this.propertyName = propertyName;
        this._childBox = childBox;
        this.propertyClassifierName = FreLanguage.getInstance().classifierProperty(
            node.freLanguageConcept(),
            propertyName,
        )?.type;
        // Apply any initializer properties (including selectable from edit file)
        // console.log(`AbstractPropertyWrapperBox: role=${role} initializer=`, initializer);
        if (initializer && initializer.params) {
            // console.log(`AbstractPropertyWrapperBox: params array:`, initializer.params);
            // Log each param individually
            // initializer.params.forEach((param: any, index: number) => {
                // console.log(`AbstractPropertyWrapperBox: param[${index}]:`, param);
            // });
            // Check for selectable parameter in params array
            const selectableParam = initializer.params.find((param: any) => param.key === 'selectable');
            if (selectableParam) {
                // console.log(`AbstractPropertyWrapperBox: found selectable param:`, selectableParam);
                this.selectable = selectableParam.value === 'true';
            } else {
                console.log(`AbstractPropertyWrapperBox: no selectable param found`);
            }
        }
        FreUtils.initializeObject(this, initializer);
        // console.log(`AbstractPropertyWrapperBox: after init selectable=${this.selectable}`);
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
}
