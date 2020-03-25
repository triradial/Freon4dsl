// Generated by the ProjectIt Language Generator.
import { AllDemoConcepts } from "../../language";
import { PiTyper } from "@projectit/core";
import { DemoConceptType } from "../../language/Demo";
import {
    DemoModel,
    DemoEntity,
    DemoAttribute,
    DemoFunction,
    DemoVariable,
    DemoExpression,
    DemoPlaceholderExpression,
    DemoLiteralExpression,
    DemoStringLiteralExpression,
    DemoNumberLiteralExpression,
    DemoBooleanLiteralExpression,
    DemoAbsExpression,
    DemoBinaryExpression,
    DemoMultiplyExpression,
    DemoPlusExpression,
    DemoDivideExpression,
    DemoAndExpression,
    DemoOrExpression,
    DemoComparisonExpression,
    DemoLessThenExpression,
    DemoGreaterThenExpression,
    DemoEqualsExpression,
    DemoFunctionCallExpression,
    DemoIfExpression,
    DemoVariableRef
} from "../../language";
import { DemoAttributeType } from "../../language";
import { DemoType } from "../../language";

export class DemoTyper implements PiTyper {
    defaultType: DemoType = DemoAttributeType.ANY;

    public equalsType(elem1: AllDemoConcepts, elem2: AllDemoConcepts): boolean {
        if (this.inferType(elem1).$id === this.inferType(elem2).$id) return true;
        return false;
    }

    public inferType(modelelement: AllDemoConcepts): DemoType {
        if (modelelement instanceof DemoEntity) {
            return modelelement;
        }
        if (modelelement instanceof DemoAttributeType) {
            return modelelement;
        }
        if (modelelement instanceof DemoAttribute) {
            return this.inferType(modelelement.declaredType);
        }
        if (modelelement instanceof DemoFunction) {
            return this.inferType(modelelement.declaredType);
        }
        if (modelelement instanceof DemoVariable) {
            return this.inferType(modelelement.declaredType);
        }
        if (modelelement instanceof DemoStringLiteralExpression) {
            return DemoAttributeType.String;
        }
        if (modelelement instanceof DemoNumberLiteralExpression) {
            return DemoAttributeType.Integer;
        }
        if (modelelement instanceof DemoBooleanLiteralExpression) {
            return DemoAttributeType.Boolean;
        }
        if (modelelement instanceof DemoAbsExpression) {
            return this.inferType(modelelement.expr);
        }
        if (modelelement instanceof DemoMultiplyExpression) {
            return this.inferType(modelelement.left);
        }
        if (modelelement instanceof DemoPlusExpression) {
            return this.commonSuperType(this.inferType(modelelement.left), this.inferType(modelelement.right));
        }
        if (modelelement instanceof DemoDivideExpression) {
            return this.inferType(modelelement.left);
        }
        if (modelelement instanceof DemoComparisonExpression) {
            return DemoAttributeType.Boolean;
        }
        if (modelelement instanceof DemoFunctionCallExpression) {
            return this.inferType(modelelement.functionDefinition);
        }
        if (modelelement instanceof DemoIfExpression) {
            return this.commonSuperType(this.inferType(modelelement.whenTrue), this.inferType(modelelement.whenFalse));
        }
        if (modelelement instanceof DemoVariable) {
            return this.inferType(modelelement.declaredType);
        }
        if (modelelement instanceof DemoVariableRef) {
            return this.inferType(modelelement.attribute);
        }
        return null;
    }

    public conformsTo(elem1: DemoType, elem2: DemoType): boolean {
        if (this.inferType(elem2) === DemoAttributeType.ANY) {
            return true;
        }
        if (this.equalsType(elem1, elem2)) return true;
        return false;
    }

    public conformList(typelist1: DemoType[], typelist2: DemoType[]): boolean {
        if (typelist1.length !== typelist2.length) return false;
        let result: boolean = true;
        for (let index in typelist1) {
            result = this.conformsTo(typelist1[index], typelist2[index]);
            if (result == false) return result;
        }
        return result;
    }

    public isType(elem: AllDemoConcepts): boolean {
        // entries for all types marked as @isType
        if (elem instanceof DemoEntity) {
            return true;
        }
        if (elem instanceof DemoAttributeType) {
            return true;
        }
        return false;
    }

    private commonSuperType(type1: DemoType, type2: DemoType): DemoType {
        // not yet possible to define supertypes in any language
        if (type1 === type2) return type1;
        return this.defaultType;
    }
}
