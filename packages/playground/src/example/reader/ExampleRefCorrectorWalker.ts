// Generated by the ProjectIt Language Generator.
import {
    Attribute,
    AttributeRef, BooleanLiteralExpression,
    ExampleEveryConcept,
    LoopVariableRef, Parameter, ParameterRef, PiElementReference
} from "./../language/gen";
import { ExampleWorker } from "../utils/gen/ExampleWorker";
import { ExampleDefaultWorker } from "../utils/gen";
import { ExampleEnvironment } from "../environment/gen/ExampleEnvironment";
import { PiElement } from "@projectit/core";

export class ExampleRefCorrectorWalker extends ExampleDefaultWorker implements ExampleWorker {
    changesToBeMade: Map<PiElement, ExampleEveryConcept> = null;

    constructor(changesToBeMade: Map<PiElement, ExampleEveryConcept>) {
        super();
        this.changesToBeMade = changesToBeMade;
    }
    /**
     * Visits 'modelelement' before visiting its children.
     * @param modelelement
     */
    public execBeforeLoopVariableRef(modelelement: LoopVariableRef): boolean {
        let referredElem = modelelement.variable;
        if (!!modelelement.variable && modelelement.variable.referred === null) { // cannot find a loop variable with this name
            const scoper = ExampleEnvironment.getInstance().scoper;
            const possibles = scoper.getVisibleElements(modelelement).filter(elem => elem.name === referredElem.name);
            if (possibles.length > 0) {
                // element probably refers to something with another type
                let replacement: ExampleEveryConcept = null;
                possibles.map(elem => {
                    const metatype = elem.piLanguageConcept();
                    if ( metatype === "Parameter" ) {
                        replacement = ParameterRef.create({parameter: PiElementReference.create<Parameter>(referredElem.name, metatype)});
                    } else if ( metatype === "Attribute" ) {
                        replacement = AttributeRef.create({attribute: PiElementReference.create<Attribute>(referredElem.name, metatype)});
                    }
                });
                this.changesToBeMade.set( modelelement, replacement );
            } else {
                // true error, or boolean "true" or "false"
                if (referredElem.name === "true") {
                    this.changesToBeMade.set( modelelement, BooleanLiteralExpression.create({value: true}));
                } else if (referredElem.name === "false") {
                    this.changesToBeMade.set( modelelement, BooleanLiteralExpression.create({value: false}));
                }
            }
        }
        return false;
    }

}
