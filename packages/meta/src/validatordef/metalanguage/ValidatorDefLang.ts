import { PiLangConceptReference, LangRefExpression } from "../../languagedef/metalanguage/PiLangReferences";

export class PiValidatorDef {
    validatorName: string;
    languageName: string;
    conceptRules: ConceptRuleSet[];

    constructor() { 
    }
}

export class ConceptRuleSet {
    conceptRef: PiLangConceptReference;
    rules: ValidationRule[];
}

export abstract class ValidationRule {   
    toPiString() : string {
        return "SHOULD BE IMPLEMENTED BY SUBCLASSES OF 'ValidatorDefLang.Rule'";
    }
}

export class EqualsTypeRule extends ValidationRule {
    type1: LangRefExpression;
    type2: LangRefExpression;

    toPiString(): string {
        return `@typecheck equalsType( ${this.type1.toPiString()}, ${this.type2.toPiString()} )`;
    }
}

export class ConformsTypeRule extends ValidationRule {
    type1: LangRefExpression;
    type2: LangRefExpression;

    toPiString(): string {
        return `@typecheck conformsTo( ${this.type1.toPiString()}, ${this.type2.toPiString()} )`;
    }
}

export class NotEmptyRule extends ValidationRule {
    property: LangRefExpression;

    toPiString(): string {
        return `@notEmpty ${this.property.toPiString()}`; 
    }
}
export class ValidNameRule extends ValidationRule {
    property: LangRefExpression;

    toPiString(): string {
        return `@validName ${this.property.toPiString()}`; 
    }
}

