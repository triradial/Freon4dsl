// Generated by the ProjectIt Language Generator (4/1/2020, 2:08:58 PM).
import { AllTaxRulesConcepts } from "../../language/gen/";
import { RevenueService, TaxRulesConceptType } from "../../language/gen/";
import { PiNamedElement } from "@projectit/core";

export class TaxRulesNamespace {
    _myElem: AllTaxRulesConcepts; // any element in the model

    constructor(elem: AllTaxRulesConcepts) {
        this._myElem = elem;
    }

    // if excludeSurrounding is true, then the elements from all parent namespaces are
    // not included in the result
    public getVisibleElements(metatype?: TaxRulesConceptType, excludeSurrounding?: boolean): PiNamedElement[] {
        let result: PiNamedElement[] = [];
        // from modelelement get its surrounding namespace
        let ns = this.getSurroundingNamespace(this._myElem);
        if (ns !== null) {
            result = ns.internalVis(metatype);
        }
        if (!(!(excludeSurrounding === undefined) && excludeSurrounding)) {
            // add elements from surrounding Namespaces
            let parent: AllTaxRulesConcepts = this.getParent(this._myElem);
            while (parent !== null) {
                ns = this.getSurroundingNamespace(parent);
                if (ns !== null) {
                    // join the results
                    ns.internalVis(metatype).forEach(elem => {
                        // shadow name in outer namespace if it is already present
                        if (!result.includes(elem)) result.push(elem);
                    });
                }
                // skip modelelements between parent and the modelelement that is its surrounding namespace
                parent = this.getParent(ns._myElem);
            }
        }
        return result;
    }

    private internalVis(metatype?: TaxRulesConceptType): PiNamedElement[] {
        let result: PiNamedElement[] = [];

        // for now we push all parts, later public/private annotations need to be taken into account

        return result;
    }

    private getSurroundingNamespace(modelelement: AllTaxRulesConcepts): TaxRulesNamespace {
        if (modelelement === null) {
            return null;
        }
        if (this.isNameSpace(modelelement)) {
            return new TaxRulesNamespace(modelelement);
        } else {
            return this.getSurroundingNamespace(this.getParent(modelelement));
        }
    }

    private isNameSpace(modelelement: AllTaxRulesConcepts): boolean {
        // if-statement generated for each concept marked with @namespace annotation!

        if (modelelement instanceof RevenueService) return true;
        return false;
    }

    private getParent(modelelement: AllTaxRulesConcepts): AllTaxRulesConcepts {
        // should be moved to PiElement
        let parent: AllTaxRulesConcepts = null;
        if (modelelement.piContainer() !== null) {
            if (modelelement.piContainer().container !== null) {
                // if (modelelement.piContainer().container instanceof AllTaxRulesConcepts) {
                parent = modelelement.piContainer().container as AllTaxRulesConcepts;
                // }
            }
        }
        return parent;
    }

    private addIfTypeOK(z: PiNamedElement, result: PiNamedElement[], metatype?: TaxRulesConceptType) {
        if (metatype) {
            if (z.piLanguageConcept() === metatype) {
                result.push(z);
            }
        } else {
            result.push(z);
        }
    }
}
