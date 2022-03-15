// Generated by the ProjectIt Language Generator.
import { PiTyperPart } from "@projectit/core";
import {
    GenericKind,
    GenericLiteral,
    GenericType,
    NamedExp, NamedType,
    PiElementReference,
    PlusExp,
    PredefinedType, SimpleType, Type,
    TypeDeclaration,
    TyTestEveryConcept, UnitKind,
    UnitLiteral,
    UnitOfMeasurement
} from "../language/gen";
import { TyTestTyper } from "./gen/TyTestTyper";
import { TyTestEnvironment } from "../environment/gen/TyTestEnvironment";

/**
 * Class 'CustomTyTestTyperPart' is meant to be a convient place to add any
 * custom code for type checking.
 */
export class CustomTyTestTyperPart implements PiTyperPart {
    mainTyper: TyTestTyper;

    /**
     * See interface
     */
    public inferType(modelelement: TyTestEveryConcept): TyTestEveryConcept | null {
        const writer = TyTestEnvironment.getInstance().writer;
        if (modelelement.piLanguageConcept() === "NumberLiteral") {
            return PredefinedType.NUMBER;
        } else if (modelelement.piLanguageConcept() === "StringLiteral") {
            return PredefinedType.STRING;
        } else if (modelelement.piLanguageConcept() === "BooleanLiteral") {
            return PredefinedType.BOOLEAN;
        } else if (modelelement.piLanguageConcept() === "NamedExp") {
            //     infertype self.myType;
            return this.mainTyper.inferType((modelelement as NamedExp).myType);
        } else if (modelelement.piLanguageConcept() === "PlusExp") {
            //     infertype commonSuperType(self.left, self. right);
            // return this.mainTyper.commonSuperType((modelelement as PlusExp).left, (modelelement as PlusExp). right);
        } else if (modelelement.piLanguageConcept() === "UnitLiteral") {
            //     infertype x:UnitOfMeasurement where {
            //         x.baseType equalsto typeof(self.inner);
            //         x.unit equalsto self.unit;
            //     };
            const $baseType: TyTestEveryConcept = this.mainTyper.inferType((modelelement as UnitLiteral).inner);
            const $unit: UnitKind = (modelelement as UnitLiteral).unit.referred;
            // console.log("inferType for unit literal: " + $baseType.piLanguageConcept());
            if ($baseType instanceof PredefinedType) {
                const result = UnitOfMeasurement.create({
                    baseType: PiElementReference.create($baseType, "PredefinedType"),
                    unit: PiElementReference.create($unit, "UnitKind")
                });
                // console.log("inferType for unit literal222: " + result.baseType?.referred.piLanguageConcept() + result.unit.referred);
                return result;
            }
        } else if (modelelement.piLanguageConcept() === "GenericLiteral") {
            //     infertype x:GenericType where {
            //         typeof(x.innerType) equalsto typeof(self.content);
            //         x.kind equalsto self.kind;
            //     };
            const $innerType: TyTestEveryConcept = this.mainTyper.inferType((modelelement as GenericLiteral).content[0]);
            const $kind: PiElementReference<GenericKind> = PiElementReference.create((modelelement as GenericLiteral).kind.referred, "GenericKind");
            if ($innerType instanceof TypeDeclaration) {
                return GenericType.create({
                    innerType: $innerType,
                    kind: $kind
                });
            } else if ($innerType instanceof PredefinedType || $innerType instanceof NamedType) {
                const $type: PiElementReference<Type> = PiElementReference.create($innerType, "Type");
                return GenericType.create({
                    innerType: SimpleType.create({ type: $type }),
                    kind: $kind
                });
            }
        } else if (modelelement.piLanguageConcept() === "SimpleType") {
            // console.log("inferType of SimpleType: " + writer.writeToString(modelelement))
            return (modelelement as SimpleType).type.referred;
        }
        return null;
    }
    /**
     * See interface
     */
    public equalsType(elem1: TyTestEveryConcept, elem2: TyTestEveryConcept): boolean | null {
        const writer = TyTestEnvironment.getInstance().writer;
        const type1: TyTestEveryConcept = this.mainTyper.inferType(elem1);
        const type2: TyTestEveryConcept = this.mainTyper.inferType(elem2);
        if (type1 === null) {
            // console.log("found null type for "+ writer.writeToString(elem1) + ', ' + elem1.piLanguageConcept());
            return false;
        }
        if (type2 === null) {
            // console.log("found null type for "+ writer.writeToString(elem2) + ', ' + elem2.piLanguageConcept());
            return false;
        }
        // console.log("found type1: " + writer.writeToString(type1) + ', type2: ' + writer.writeToString(type2));
        if (type1.piLanguageConcept() !== type2.piLanguageConcept()) {
            // console.log("language concepts wrong: " + type1.piLanguageConcept() + ", " + type2.piLanguageConcept())
            return false;
        }
        if (type1.piLanguageConcept() === "SimpleType"){
            // equalsto self.type;
            // console.log("simpleType")
            return this.mainTyper.equalsType((type1 as SimpleType).type.referred, (type2 as SimpleType).type.referred);
        } else if (type1.piLanguageConcept() === "NamedType"){
            // equalsto aa:NamedType where {
            //     aa.name equalsto self.name;
            // };
            // console.log("NamedType")
            return (type1 as NamedType).name === (type2 as NamedType).name;
        } else if (type1.piLanguageConcept() === "GenericType"){
            // equalsto x:GenericType where {
            //     x.innerType equalsto self.innerType;
            //     x.kind equalsto self.kind;
            // };
            const condition1: boolean = this.mainTyper.equalsType((type1 as GenericType).innerType, (type2 as GenericType).innerType);
            const condition2: boolean = (type1 as GenericType).kind.referred === (type2 as GenericType).kind.referred;
            // console.log("GenericType: " + writer.writeToString(elem1) + condition1 + ", " + condition2);
            return condition1 && condition2;
        } else if (type1.piLanguageConcept() === "UnitOfMeasurement"){
            // equalsto aap:UnitOfMeasurement where {
            //     aap.baseType equalsto self.baseType;
            //     aap.unit equalsto self.unit;
            // };
            const condition1: boolean = this.mainTyper.equalsType((type1 as UnitOfMeasurement).baseType.referred, (type2 as UnitOfMeasurement).baseType.referred);
            const condition2: boolean = (type1 as UnitOfMeasurement).unit === (type2 as UnitOfMeasurement).unit;
            // console.log("UnitOfMeasurement " + writer.writeToString(elem1) + condition1 + ", " + condition2);
            return condition1 && condition2;
        } else if (type1.piLanguageConcept() === "PredefinedType"){
            return type1 === type2;
        }
        return null;
    }
    /**
     * See interface
     */
    public conformsTo(elem1: TyTestEveryConcept, elem2: TyTestEveryConcept): boolean | null {
        return null;
    }
    /**
     * See interface
     */
    public conformList(typelist1: TyTestEveryConcept[], typelist2: TyTestEveryConcept[]): boolean | null {
        return null;
    }
    /**
     * See interface
     */
    public isType(elem: TyTestEveryConcept): boolean | null {
        // if (elem.piLanguageConcept() === "PredefinedType") {
        //     return true;
        // } else if (elem.piLanguageConcept() === "NamedType") {
        //     return true;
        // } else if (elem.piLanguageConcept() === "TypeDeclaration") {
        //     return true;
        // } else if (elem.piLanguageConcept() === "SimpleType") {
        //     return true;
        // } else if (elem.piLanguageConcept() === "GenericType") {
        //     return true;
        // } else if (elem.piLanguageConcept() === "UnitOfMeasurement") {
        //     return true;
        // }
        return null;
    }
}
