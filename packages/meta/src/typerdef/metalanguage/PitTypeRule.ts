// Generated by the ProjectIt Language Generator.

import { PitExp } from "./expressions";
import { PiClassifier, PiElementReference } from "../../languagedef/metalanguage";
import { PitClassifierSpec } from "./PitClassifierSpec";
import { PiTyperElement } from "./PiTyperElement";

/**
 * Class PitTypeRule is the implementation of the concept with the same name in the language definition file.
 * It uses mobx decorators to enable parts of the language environment, e.g. the editor, to react
 * to changes in the state of its properties.
 */
export abstract class PitTypeRule extends PiTyperElement {
    readonly $typename: string = "PitTypeRule"; // holds the metatype in the form of a string
    $id: string; // a unique identifier

    exp: PitExp; // implementation of part 'exp'
    __returnType: PiElementReference<PiClassifier>;    // to be set by the checker
    owner: PitClassifierSpec;

    toPiString() {
        return "TO BE IMPLEMENTED BY SUBCLASSES OF PitTypeRule";
    }
    get returnType(): PiClassifier {
        if (!!this.__returnType && !!this.__returnType.referred) {
            return this.__returnType.referred;
        }
        return null;
    }
    set returnType(cls: PiClassifier) {
        if (!!cls) {
            this.__returnType = PiElementReference.create<PiClassifier>(cls, "PiClassifier");
            // TODO owner of PiElementReference
            // this.__returnType.owner = this.language;
        }
    }
}
