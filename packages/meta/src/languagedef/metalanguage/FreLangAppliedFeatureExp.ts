import { FreMetaProperty } from "./FreMetaLanguage.js";
import { FreLangExp } from "./FreLangBaseExp.js";
import { MetaElementReference } from "./MetaElementReference.js";

export class FreLangAppliedFeatureExp extends FreLangExp<FreMetaProperty> {
    static create(owner: FreLangExp, name: string, referred: FreMetaProperty): FreLangAppliedFeatureExp {
        const result = new FreLangAppliedFeatureExp();
        result.referredElement = referred;
        result.sourceName = name;
        result.sourceExp = owner;
        return result;
    }

    // @ts-ignore
    sourceExp: FreLangExp;
    // @ts-ignore
    $referredElement: MetaElementReference<FreMetaProperty>;

    get referredElement(): FreMetaProperty {
        return this.$referredElement?.referred;
    }

    set referredElement(p: FreMetaProperty) {
        this.$referredElement = MetaElementReference.create<FreMetaProperty>(p, "FreProperty");
        this.$referredElement.owner = this;
    }

    get reference(): MetaElementReference<FreMetaProperty> {
        return this.$referredElement;
    }

    set reference(p: MetaElementReference<FreMetaProperty>) {
        this.$referredElement = p;
        this.$referredElement.owner = this;
    }

    toFreString(): string {
        return this.sourceName + (this.appliedfeature ? "." + this.appliedfeature.toFreString() : "");
    }

    findRefOfLastAppliedFeature(): FreMetaProperty {
        if (this.appliedfeature !== undefined) {
            return this.appliedfeature.findRefOfLastAppliedFeature();
        } else {
            return this.$referredElement?.referred;
        }
    }
} 