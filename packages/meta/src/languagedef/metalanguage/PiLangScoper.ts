import {
    PiLangElement,
    PiClassifier,
    PiConcept,
    PiConceptProperty,
    PiInterface,
    PiLanguage,
    PiProperty,
    PiLangAppliedFeatureExp,
    PiPrimitiveType, PiLimitedConcept
} from "./internal";
import { MetaLogger } from "../../utils/MetaLogger";
import { Checker, PiDefinitionElement } from "../../utils";
// import { PitWhereExp } from "../../typerdef/new-metalanguage";

const LOGGER = new MetaLogger("PiLangScoper"); // .mute();
const anyElement = "_$anyElement";

export class PiLangScoper {
    public language: PiLanguage;

    public getFromVisibleElements(owner: PiDefinitionElement, name: string, typeName: string): PiLangElement {
        let result: PiLangElement;
        if (typeName === "PiPrimitiveType" ) {
            result = PiPrimitiveType.find(name);
        } else if (typeName === "PiConcept" || typeName === "PiLimitedConcept" || typeName === "PiExpressionConcept" || typeName === "PiBinaryExpressionConcept") {
            result = this.language.findConcept(name);
        } else if (typeName === "PiUnitDescription" ) {
            result = this.language.findUnitDescription(name);
        } else if (typeName === "PiInterface" ) {
            result = this.language.findInterface(name);
        } else if (typeName === "PiClassifier" ) {
            result = this.language.findClassifier(name);
        } else if (typeName === "PiProperty" || typeName === "PiPrimitiveProperty" || typeName === "PiConceptProperty") {
            if (owner instanceof PiLangAppliedFeatureExp) {
                const xx = owner.sourceExp.__referredElement?.referred;
                if (!(!!xx)) {
                    LOGGER.error(`Incorrect use of applied feature, source expression has unknown reference: '${owner.sourceExp.sourceName}'.`);
                }
                if (!!xx && xx instanceof PiClassifier) {
                    result = xx.allProperties().filter(prop => prop.name === name)[0];
                }
            }
        } else if (typeName === "PiInstance" ) {
            this.language.concepts.filter(c => c instanceof PiLimitedConcept).forEach(lim => {
                const tmp = (lim as PiLimitedConcept).findInstance(name);
                if (!!tmp) {
                    result = tmp;
                }
            });
        } else if (typeName === "PitProperty" ) {
            if (owner instanceof PiClassifier) {
                result = owner.allProperties().filter(prop => prop.name === name)[0];
            // } else if (owner instanceof PitWhereExp) {
            //     if (owner.otherType.name === name) {
            //         result = owner.otherType;
            //     }
            }
        } else {
            let ownerDescriptor: string;
            if (owner instanceof PiLangElement) {
                ownerDescriptor = owner.name;
            } else {
                ownerDescriptor = Checker.location(owner);
            }
            console.error("NO calculation found for " + name + ", owner: " + ownerDescriptor + ", type:" + typeName);
        }
        return result;
    }

}
