import { FreMetaLangElement } from "./FreMetaLangElement.js";
import { FreMetaProperty, FreMetaLanguage } from "./FreMetaLanguage.js";
import { MetaElementReference } from "./MetaElementReference.js";

export abstract class FreLangExp<T extends FreMetaLangElement = FreMetaLangElement> extends FreMetaLangElement {
    sourceName: string = ""; // either the 'XXX' in "XXX.yyy" or 'yyy' in "yyy"
    // @ts-ignore
    appliedfeature: any; // either the 'yyy' in "XXX.yyy" or 'null' in "yyy"
    // @ts-ignore
    $referredElement: MetaElementReference<T>; // refers to the element called 'sourceName'
    // @ts-ignore
    language: FreMetaLanguage; // the language for which this expression is defined

    // returns the property to which the complete expression refers, i.e. the element to which the 'd' in 'a.b.c.d' refers.
    findRefOfLastAppliedFeature(): FreMetaProperty | undefined {
        if (!!this.language) {
            if (this.appliedfeature !== undefined) {
                return this.appliedfeature.findRefOfLastAppliedFeature();
            } else {
                const found: FreMetaLangElement = this.$referredElement?.referred;
                if (found instanceof FreMetaProperty) {
                    return found;
                }
            }
        } else {
            throw Error("Applied feature cannot be found because language is not set.");
        }
        return undefined;
    }

    toFreString(): string {
        return "SHOULD BE IMPLEMENTED BY SUBCLASSES OF 'FreLangExpressions.FreLangExp'";
    }
} 