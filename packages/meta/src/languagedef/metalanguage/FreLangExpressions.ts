import { FreLangExp } from "./FreLangBaseExp.js";
import type { FreLangAppliedFeatureExp } from "./FreLangAppliedFeatureExp.js";
import { FreMetaProperty, FreMetaClassifier, FreMetaInstance } from "./FreMetaLanguage.js";
import { MetaElementReference } from "./MetaElementReference.js";
import { Names } from "../../utils/index.js";

/** This module contains classes that implement Expressions over the FreLanguage structure.
 *  There are five types of Expressions:
 *  1. Simple expression: a simple value, currently only numbers
 *  2. Instance expression: an expression that refers to a predefined instance of a limited concept, e.g. DemoAttributeType:Integer
 *  3. Functions expression: an expression that refers to one of the functions that may be used in the typer and/or validator, like 'conformsto'
 *  4. Concept expression: an expression that refers to a keyword, currently only 'owner'
 *  5. Self expression: an expression that refers to a property of a classifier, like 'self.age'
 */

// Some properties of the classes defined here are marked @ts-ignore to avoid the error:
// TS2564: ... has no initializer and is not definitely assigned in the constructor.
// These properties need to be undefined during parsing and checking. After the checking process
// has been executed without errors, we can assume that these properties are initialized.

export class FreLangSelfExp extends FreLangExp<FreMetaClassifier> {
    static create(): FreLangSelfExp {
        return new FreLangSelfExp();
    }

    toFreString(): string {
        return "self" + (this.appliedfeature ? "." + this.appliedfeature.toFreString() : "");
    }
}

export class FreInstanceExp extends FreLangExp<FreMetaInstance> {
    // sourceName should be the name of a limited concept
    instanceName: string = ""; // should be the name of one of the predefined instances of 'sourceName'

    toFreString(): string {
        return this.sourceName + ":" + this.instanceName;
    }
}

export class FreLangFunctionCallExp extends FreLangExp<FreMetaProperty> {
    static create(owner: FreLangExp, name: string, referred: FreMetaProperty): FreLangFunctionCallExp {
        const result = new FreLangFunctionCallExp();
        result.referredElement = referred;
        result.sourceName = name;
        result.sourceExp = owner;
        return result;
    }

    // @ts-ignore
    sourceExp: FreLangExp;
    actualparams: FreLangExp[] = [];
    // @ts-ignore
    returnValue: boolean;

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
        if (!!this.sourceName && this.sourceName !== Names.nameForSelf) {
            return this.sourceName + (this.appliedfeature ? "." + this.appliedfeature.toFreString() : "");
        } else {
            return this.appliedfeature ? this.appliedfeature.toFreString() : "";
        }
    }
}

export class FreLangConceptExp extends FreLangExp<FreMetaClassifier> {
    static create(owner: FreLangExp, name: string, referred: FreMetaClassifier): FreLangConceptExp {
        const result = new FreLangConceptExp();
        result.referredElement = referred;
        result.sourceName = name;
        result.sourceExp = owner;
        return result;
    }

    // @ts-ignore
    sourceExp: FreLangExp;

    get referredElement(): FreMetaClassifier {
        return this.$referredElement?.referred;
    }

    set referredElement(p: FreMetaClassifier) {
        this.$referredElement = MetaElementReference.create<FreMetaClassifier>(p, "FreClassifier");
        this.$referredElement.owner = this;
    }

    get reference(): MetaElementReference<FreMetaClassifier> {
        return this.$referredElement;
    }

    set reference(p: MetaElementReference<FreMetaClassifier>) {
        this.$referredElement = p;
        this.$referredElement.owner = this;
    }

    toFreString(): string {
        return this.sourceName + (this.appliedfeature ? "." + this.appliedfeature.toFreString() : "");
    }

    findRefOfLastAppliedFeature(): FreMetaProperty | undefined {
        if (this.appliedfeature !== undefined) {
            return this.appliedfeature.findRefOfLastAppliedFeature();
        } else {
            return undefined;
        }
    }
}

export class FreLangPropertyCallExp extends FreLangExp<FreMetaProperty> {
    static create(owner: FreLangExp, name: string, referred: FreMetaProperty): FreLangPropertyCallExp {
        const result = new FreLangPropertyCallExp();
        result.referredElement = referred;
        result.sourceName = name;
        result.sourceExp = owner;
        return result;
    }

    // @ts-ignore
    sourceExp: FreLangExp;

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

    findRefOfLastAppliedFeature(): FreMetaProperty | undefined {
        if (this.appliedfeature !== undefined) {
            return this.appliedfeature.findRefOfLastAppliedFeature();
        } else {
            return undefined;
        }
    }
}

export class FreLangSimpleExp extends FreLangExp<FreMetaProperty> {
    static create(owner: FreLangExp, name: string, referred: FreMetaProperty): FreLangSimpleExp {
        const result = new FreLangSimpleExp();
        result.referredElement = referred;
        result.sourceName = name;
        result.sourceExp = owner;
        return result;
    }

    // @ts-ignore
    sourceExp: FreLangExp;

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

    findRefOfLastAppliedFeature(): FreMetaProperty | undefined {
        if (this.appliedfeature !== undefined) {
            return this.appliedfeature.findRefOfLastAppliedFeature();
        } else {
            return undefined;
        }
    }
}

export { FreLangAppliedFeatureExp };

