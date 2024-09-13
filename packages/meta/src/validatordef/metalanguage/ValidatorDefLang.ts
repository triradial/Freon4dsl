// Note that the following import cannot be from "@freon4dsl/core", because
import { FreLangExp, FreMetaConcept } from "../../languagedef/metalanguage/index.js";
// The next import should be separate and the last of the imports.
// Otherwise, the run-time error 'Cannot read property 'create' of undefined' occurs.
// See: https://stackoverflow.com/questions/48123645/error-when-accessing-static-properties-when-services-include-each-other
// and: https://stackoverflow.com/questions/45986547/property-undefined-typescript
import { MetaElementReference } from "../../languagedef/metalanguage/MetaElementReference.js";
import { FreMetaDefinitionElement } from "../../utils/index.js";
// this leads to a load error
// import { FreErrorSeverity } from "@freon4dsl/core"; // todo remove this bug
import { FreErrorSeverity } from "../../utils/generation/FreErrorSeverity.js";

export class ValidatorDef extends FreMetaDefinitionElement {
    validatorName: string = "";
    languageName: string = "";
    conceptRules: ConceptRuleSet[] = [];
}

export class ConceptRuleSet extends FreMetaDefinitionElement {
    conceptRef: MetaElementReference<FreMetaConcept> | undefined;
    rules: ValidationRule[] = [];
}

export class ValidationSeverity extends FreMetaDefinitionElement {
    // 'value' is the string that the language engineer has provided in the .valid file
    // it will be disregarded after checking, instead 'severity' will be used
    value: string = "";
    severity: FreErrorSeverity | undefined; // is set by the checker
}

export class ValidationMessage extends FreMetaDefinitionElement {
    content: ValidationMessagePart[] = [];
    toFreString(): string {
        return this.content.map((p) => p.toFreString()).join(" ");
    }
}

export type ValidationMessagePart = ValidationMessageText | ValidationMessageReference;

export class ValidationMessageText extends FreMetaDefinitionElement {
    value: string = "";
    toFreString(): string {
        return this.value;
    }
}

export class ValidationMessageReference extends FreMetaDefinitionElement {
    expression: FreLangExp | undefined;
    toFreString(): string {
        if (!!this.expression) {
            return this.expression.toFreString();
        } else {
            return "<unknown expression in ValidationMessageReference>";
        }
    }
}

export abstract class ValidationRule extends FreMetaDefinitionElement {
    severity: ValidationSeverity;
    message: ValidationMessage | undefined;

    constructor() {
        super();
        this.severity = new ValidationSeverity();
        this.severity.severity = FreErrorSeverity.NONE;
        this.severity.value = "";
    }
    toFreString(): string {
        return "SHOULD BE IMPLEMENTED BY SUBCLASSES OF 'ValidatorDefLang.Rule'";
    }
}

export class CheckEqualsTypeRule extends ValidationRule {
    type1: FreLangExp | undefined;
    type2: FreLangExp | undefined;

    toFreString(): string {
        if (!!this.type1 && !!this.type2) {
            return `@typecheck equalsType( ${this.type1.toFreString()}, ${this.type2.toFreString()} )`;
        } else {
            return "<unknown check equals type rule>";
        }
    }
}

export class CheckConformsRule extends ValidationRule {
    type1: FreLangExp | undefined;
    type2: FreLangExp | undefined;

    toFreString(): string {
        if (!!this.type1 && !!this.type2) {
            return `@typecheck conformsTo( ${this.type1.toFreString()}, ${this.type2.toFreString()} )`;
        } else {
            return "<unknown check conforms rule>";
        }
    }
}

export class ExpressionRule extends ValidationRule {
    exp1: FreLangExp | undefined;
    exp2: FreLangExp | undefined;
    comparator: FreComparator | undefined;

    toFreString(): string {
        if (!!this.exp1 && !!this.exp2) {
            return `${this.exp1.toFreString()} ${this.comparator} ${this.exp2.toFreString()}`;
        } else {
            return "<unknown expression rule>";
        }
    }
}

export class IsUniqueRule extends ValidationRule {
    list: FreLangExp | undefined;
    listproperty: FreLangExp | undefined;
    comparator: FreComparator | undefined;

    toFreString(): string {
        if (!!this.listproperty && !!this.list) {
            return `isunique ${this.listproperty.toFreString()} in ${this.list.toFreString()}`;
        } else {
            return "isunique <unknown property> in <unknown expression>";
        }
    }
}

export class NotEmptyRule extends ValidationRule {
    property: FreLangExp | undefined;

    toFreString(): string {
        if (!!this.property) {
            return `@notEmpty ${this.property.toFreString()}`;
        } else {
            return "@notEmpty <unknown property>";
        }
    }
}
export class ValidNameRule extends ValidationRule {
    property: FreLangExp | undefined;

    toFreString(): string {
        if (!!this.property) {
            return `@validName ${this.property.toFreString()}`;
        } else {
            return "@validName <unknown property>";
        }
    }
}

export enum FreComparator {
    Equals = "=",
    LargerThen = ">",
    LargerIncluding = ">=",
    SmallerThen = "<",
    SmallerIncluding = "<=",
}
