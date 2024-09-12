import { LangUtil, ParseLocation } from "../../utils/index.js";
import { MetaElementReference } from "./internal.js";
// This import cannot be shortened. Importing "../../utils" results in circular dependencies
import { FreMetaDefinitionElement } from "../../utils/FreMetaDefinitionElement.js";

// Some properties of the classes defined here are marked @ts-ignore to avoid the error:
// TS2564: ... has no initializer and is not definitely assigned in the constructor.
// These properties need to be undefined during parsing and checking. After the checking process
// has been executed without errors, we can assume that these properties are initialized.

// root of the inheritance structure of all elements in a language definition
export abstract class FreMetaLangElement extends FreMetaDefinitionElement {
    protected _name: string = "";
    get name(): string {
        return this._name;
    }
    set name(v: string) {
        this._name = v;
    }
}

export class FreMetaLanguage extends FreMetaLangElement {
    concepts: FreMetaConcept[] = [];
    interfaces: FreMetaInterface[] = [];
    // @ts-ignore
    modelConcept: FreMetaModelDescription;
    units: FreMetaUnitDescription[] = [];
    id: string = "";
    key: string = "";
    usedLanguages: string[] = [];

    constructor() {
        super();
        this.name = "";
    }

    get NAME(): string {
        return this._name;
    }
    get name(): string {
        if (!!this.modelConcept) {
            return this.modelConcept.name;
        } else {
            return this._name;
        }
    }
    set name(v: string) {
        this._name = v;
    }

    classifiers(): FreMetaClassifier[] {
        const result: FreMetaClassifier[] = this.concepts;
        return result.concat(this.interfaces).concat(this.units);
    }

    conceptsAndInterfaces(): FreMetaClassifier[] {
        const result: FreMetaClassifier[] = this.concepts;
        return result.concat(this.interfaces);
    }

    findConcept(name: string): FreMetaConcept | undefined {
        return this.concepts.find((con) => con.name === name);
    }

    findInterface(name: string): FreMetaInterface | undefined {
        return this.interfaces.find((con) => con.name === name);
    }

    findClassifier(name: string): FreMetaClassifier | undefined {
        let result: FreMetaClassifier | undefined;
        result = this.findConcept(name);
        if (result === undefined) {
            result = this.findInterface(name);
        }
        if (result === undefined) {
            result = this.findUnitDescription(name);
        }
        if (result === undefined) {
            result = this.findBasicType(name);
        }
        return result;
    }

    findBasicType(name: string): FreMetaClassifier {
        // If not found, this method returns $freAny
        return FreMetaPrimitiveType.find(name);
    }

    findUnitDescription(name: string): FreMetaUnitDescription | undefined {
        return this.units.find((u) => u.name === name);
    }
}

export // Type to keep info about a part that needs to be initialized and its implementing concept
type PartInitializer = {
    part: FreMetaConceptProperty; // the part that needs initializing
    concept: FreMetaConcept; // T he class that needs tp be constructed
};

export abstract class FreMetaClassifier extends FreMetaLangElement {
    private static __ANY: FreMetaClassifier;

    static get ANY(): FreMetaClassifier {
        if (FreMetaClassifier.__ANY === null || FreMetaClassifier.__ANY === undefined) {
            FreMetaClassifier.__ANY = new FreMetaConcept();
            FreMetaClassifier.__ANY.name = "ANY";
        }
        return this.__ANY;
    }

    id: string = "";
    key: string = "";

    // @ts-ignore
    private _owningLanguage: FreMetaLanguage;
    // @ts-ignore
    originalOwningLanguage: FreMetaLanguage;
    get language() {
        return this._owningLanguage;
    }
    set language(c: FreMetaLanguage) {
        if (this._owningLanguage === undefined || this._owningLanguage === null) {
            this._owningLanguage = c;
            // if (this.originalOwningLanguage === undefined || this.originalOwningLanguage === null) {
            this.originalOwningLanguage = c;
            // }
        } else {
            // this.originalOwningLanguage = this._owningLanguage;
            this._owningLanguage = c;
        }
    }

    isPublic: boolean = false;
    properties: FreMetaProperty[] = [];
    // TODO remove this attribute and make it a function on 'properties'
    primProperties: FreMetaPrimitiveProperty[] = [];
    // get primProperties(): FrePrimitiveProperty[] {
    //     return this.properties.filter(prop => prop instanceof FrePrimitiveProperty) as FrePrimitiveProperty[];
    //     // of
    //     return this.properties.filter(prop => prop.type instanceof FrePrimitiveType) as FrePrimitiveProperty[];
    // }

    parts(): FreMetaConceptProperty[] {
        return this.properties.filter(
            (p) => p instanceof FreMetaConceptProperty && p.isPart,
        ) as FreMetaConceptProperty[];
    }

    references(): FreMetaConceptProperty[] {
        return this.properties.filter(
            (p) => p instanceof FreMetaConceptProperty && !p.isPart,
        ) as FreMetaConceptProperty[];
    }

    allPrimProperties(): FreMetaPrimitiveProperty[] {
        const result: FreMetaPrimitiveProperty[] = [];
        result.push(...this.primProperties);
        return result;
    }

    allParts(): FreMetaConceptProperty[] {
        return this.parts();
    }

    allReferences(): FreMetaConceptProperty[] {
        return this.references();
    }

    allProperties(): FreMetaProperty[] {
        const result: FreMetaProperty[] = [];
        result.push(...this.allPrimProperties());
        result.push(...this.allParts());
        result.push(...this.allReferences());
        return result;
    }

    allSingleNonOptionalPartsInitializers(): PartInitializer[] {
        return this.allParts().flatMap((prop) => {
            if (
                !prop.isPrimitive &&
                !prop.implementedInBase &&
                prop.isPart &&
                !prop.isList &&
                !prop.isOptional &&
                !prop.hasLimitedType
            ) {
                const subs = LangUtil.subConceptsIncludingSelf(prop.type);
                if (subs.length === 1 && !subs[0].isAbstract && !(subs[0].name === "FreType")) {
                    return [{ part: prop, concept: subs[0] }];
                } else {
                    return [];
                }
            }
            return [];
        });
    }

    nameProperty(): FreMetaPrimitiveProperty | undefined {
        return this.allPrimProperties().find((p) => p.name === "name" && p.type === FreMetaPrimitiveType.identifier);
    }
}

export class FreMetaModelDescription extends FreMetaClassifier {
    isPublic: boolean = true;

    unitTypes(): FreMetaUnitDescription[] {
        let result: FreMetaUnitDescription[] = [];
        // all parts of a model are units
        for (const intf of this.parts()) {
            result = result.concat(intf.type as FreMetaUnitDescription);
        }
        return result;
    }
}

export class FreMetaUnitDescription extends FreMetaClassifier {
    interfaces: MetaElementReference<FreMetaInterface>[] = []; // the interfaces that this concept implements

    fileExtension: string = "";
    isPublic: boolean = true;

    /**
     * Returns a list of properties that are either (1) defined in this concept or (2) in one of the interfaces
     * that is implemented by this concept. Excluded are properties that are defined in an interface but are already
     * included in one of the base concepts.
     */
    implementedPrimProperties(): FreMetaPrimitiveProperty[] {
        let result: FreMetaPrimitiveProperty[] = []; // return a new array!
        result.push(...this.primProperties);
        for (const intf of this.interfaces) {
            for (const intfProp of intf.referred.allPrimProperties()) {
                let allreadyIncluded = false;
                // if the prop from the interface is present in this concept, do not include
                allreadyIncluded = this.primProperties.some((p) => p.name === intfProp.name);
                // TODO The next lines are only needed if units can have other units as base classes
                // if the prop from the interface is present in the base of this concept (resursive), do not include
                // if (!allreadyIncluded && !!this.base && !!this.base.referred) {
                //     allreadyIncluded = this.base.referred.allPrimProperties().some(p => p.name === intfProp.name);
                // }
                // if the prop from the interface is present in another implemented interface, do not include
                if (!allreadyIncluded) {
                    allreadyIncluded = result.some((p) => p.name === intfProp.name);
                }
                if (!allreadyIncluded) {
                    result = result.concat(intfProp);
                }
            }
        }
        return result;
    }

    allPrimProperties(): FreMetaPrimitiveProperty[] {
        return this.implementedPrimProperties();
    }
}

export class FreMetaInterface extends FreMetaClassifier {
    base: MetaElementReference<FreMetaInterface>[] = [];

    allPrimProperties(): FreMetaPrimitiveProperty[] {
        let result: FreMetaPrimitiveProperty[] = []; // return a new array
        result.push(...this.primProperties);
        for (const intf of this.base) {
            result = result.concat(intf.referred.allPrimProperties());
        }
        return result;
    }

    allParts(): FreMetaConceptProperty[] {
        let result: FreMetaConceptProperty[] = this.parts();
        for (const intf of this.base) {
            result = result.concat(intf.referred.allParts());
        }
        return result;
    }

    allReferences(): FreMetaConceptProperty[] {
        let result: FreMetaConceptProperty[] = this.references();
        for (const intf of this.base) {
            result = result.concat(intf.referred.allReferences());
        }
        return result;
    }

    allProperties(): FreMetaProperty[] {
        let result: FreMetaProperty[] = [];
        result = result.concat(this.allPrimProperties()).concat(this.allParts()).concat(this.allReferences());
        return result;
    }

    allBaseInterfaces(): FreMetaInterface[] {
        let result: FreMetaInterface[] = [];
        for (const base of this.base) {
            const realbase = base.referred;
            if (!!realbase) {
                result.push(realbase);
                result = result.concat(realbase.allBaseInterfaces());
            }
        }
        return result;
    }

    /**
     * returns all subinterfaces, but not their subinterfaces
     */
    allSubInterfacesDirect(): FreMetaInterface[] {
        return this.language.interfaces.filter((c) => c.base?.find((b) => b.referred === this) !== undefined);
    }

    /**
     * returns all subinterfaces and subinterfaces of the subinterfaces
     */
    allSubInterfacesRecursive(): FreMetaInterface[] {
        let result = this.allSubInterfacesDirect();
        const tmp = this.allSubInterfacesDirect();
        tmp.forEach((concept) => (result = result.concat(concept.allSubInterfacesRecursive())));
        return result;
    }
}

export class FreMetaConcept extends FreMetaClassifier {
    isAbstract: boolean = false;
    // @ts-ignore
    base: MetaElementReference<FreMetaConcept>;
    interfaces: MetaElementReference<FreMetaInterface>[] = []; // the interfaces that this concept implements

    allPrimProperties(): FreMetaPrimitiveProperty[] {
        const result: FreMetaPrimitiveProperty[] = this.implementedPrimProperties();
        if (!!this.base && !!this.base.referred) {
            this.base.referred.allPrimProperties().forEach((p) => {
                // hide overwritten property
                if (!result.some((previous) => previous.name === p.name && previous.implementedInBase)) {
                    result.push(p);
                }
            });
        }
        return result;
    }

    allParts(): FreMetaConceptProperty[] {
        const result: FreMetaConceptProperty[] = this.implementedParts();
        if (!!this.base && !!this.base.referred) {
            this.base.referred.allParts().forEach((p) => {
                // hide overwritten property
                if (!result.some((previous) => previous.name === p.name && previous.implementedInBase)) {
                    result.push(p);
                }
            });
        }
        return result;
    }

    allReferences(): FreMetaConceptProperty[] {
        const result: FreMetaConceptProperty[] = this.implementedReferences();
        if (!!this.base && !!this.base.referred) {
            this.base.referred.allReferences().forEach((p) => {
                // hide overwritten property
                if (!result.some((previous) => previous.name === p.name && previous.implementedInBase)) {
                    result.push(p);
                }
            });
        }
        return result;
    }

    allProperties(): FreMetaProperty[] {
        let result: FreMetaProperty[] = [];
        result = result.concat(this.allPrimProperties()).concat(this.allParts()).concat(this.allReferences());
        return result;
    }

    /**
     * Returns a list of properties that are either (1) defined in this concept or (2) in one of the interfaces
     * that is implemented by this concept. Excluded are properties that are defined in an interface but are already
     * included in one of the base concepts.
     */
    implementedPrimProperties(): FreMetaPrimitiveProperty[] {
        let result: FreMetaPrimitiveProperty[] = []; // return a new array!
        result.push(...this.primProperties);
        for (const intf of this.interfaces) {
            for (const intfProp of intf.referred.allPrimProperties()) {
                let allreadyIncluded = false;
                // if the prop from the interface is present in this concept, do not include
                allreadyIncluded = this.primProperties.some((p) => p.name === intfProp.name);
                // if the prop from the interface is present in the base of this concept (resursive), do not include
                if (!allreadyIncluded && !!this.base && !!this.base.referred) {
                    allreadyIncluded = this.base.referred.allPrimProperties().some((p) => p.name === intfProp.name);
                }
                // if the prop from the interface is present in another implemented interface, do not include
                if (!allreadyIncluded) {
                    allreadyIncluded = result.some((p) => p.name === intfProp.name);
                }
                if (!allreadyIncluded) {
                    result = result.concat(intfProp);
                }
            }
        }
        return result;
    }

    implementedParts(): FreMetaConceptProperty[] {
        let result: FreMetaConceptProperty[] = this.parts();
        for (const intf of this.interfaces) {
            for (const intfProp of intf.referred.allParts()) {
                let allreadyIncluded = false;
                // if the prop from the interface is present in this concept, do not include
                allreadyIncluded = this.parts().some((p) => p.name === intfProp.name);
                // if the prop from the interface is present in the base of this concept, do not include
                if (!allreadyIncluded && !!this.base && !!this.base.referred) {
                    allreadyIncluded = this.base.referred.allParts().some((p) => p.name === intfProp.name);
                }
                // if the prop from the interface is present in another implemented interface, do not include
                if (!allreadyIncluded) {
                    allreadyIncluded = result.some((p) => p.name === intfProp.name);
                }
                if (!allreadyIncluded) {
                    result = result.concat(intfProp);
                }
            }
        }
        return result;
    }

    implementedReferences(): FreMetaConceptProperty[] {
        let result: FreMetaConceptProperty[] = this.references();
        for (const intf of this.interfaces) {
            for (const intfProp of intf.referred.allReferences()) {
                let allreadyIncluded = false;
                // if the prop from the interface is present in this concept, do not include
                allreadyIncluded = this.references().some((p) => p.name === intfProp.name);
                // if the prop from the interface is present in the base of this concept, do not include
                if (!allreadyIncluded && !!this.base && !!this.base.referred) {
                    allreadyIncluded = this.base.referred.allReferences().some((p) => p.name === intfProp.name);
                }
                // if the prop from the interface is present in another implemented interface, do not include
                if (!allreadyIncluded) {
                    allreadyIncluded = result.some((p) => p.name === intfProp.name);
                }
                if (!allreadyIncluded) {
                    result = result.concat(intfProp);
                }
            }
        }
        return result;
    }

    implementedProperties(): FreMetaProperty[] {
        let result: FreMetaProperty[] = [];
        result = result
            .concat(this.implementedPrimProperties())
            .concat(this.implementedParts())
            .concat(this.implementedReferences());
        return result;
    }

    allInterfaces(): FreMetaInterface[] {
        let result: FreMetaInterface[] = [];
        for (const intf of this.interfaces) {
            const realintf = intf.referred;
            if (!!realintf) {
                result.push(realintf);
                result = result.concat(realintf.allBaseInterfaces());
            }
        }
        return result;
    }

    /**
     * returns all subconcepts, but not their subconcepts
     */
    allSubConceptsDirect(): FreMetaConcept[] {
        return this.language.concepts.filter((c) => c.base?.referred === this);
    }

    /**
     * returns all subconcepts and subconcepts of the subconcepts
     */
    allSubConceptsRecursive(): FreMetaConcept[] {
        let result = this.allSubConceptsDirect();
        const tmp = this.allSubConceptsDirect();
        tmp.forEach((concept) => (result = result.concat(concept.allSubConceptsRecursive())));
        return result;
    }
}

export class FreMetaExpressionConcept extends FreMetaConcept {
    // _isPlaceHolder: boolean;
}

export class FreMetaBinaryExpressionConcept extends FreMetaExpressionConcept {
    // left: FreExpressionConcept;
    // right: FreExpressionConcept;
    priority: number = -1;

    getPriority(): number {
        const p = this.priority;
        return !!p ? p : -1;
    }
}

export class FreMetaLimitedConcept extends FreMetaConcept {
    instances: FreMetaInstance[] = [];

    findInstance(name: string): FreMetaInstance | undefined {
        return this.instances.find((inst) => inst.name === name);
    }

    allInstances(): FreMetaInstance[] {
        const result: FreMetaInstance[] = [];
        result.push(...this.instances);
        if (!!this.base && this.base.referred instanceof FreMetaLimitedConcept) {
            result.push(...this.base.referred.allInstances());
        }
        return result;
    }

    toString(): string {
        return this.name;
    }
}

export class FreMetaProperty extends FreMetaLangElement {
    id?: string = "";
    key?: string = "";
    isPublic: boolean = false;
    isOptional: boolean = false;
    isList: boolean = false;
    isPart: boolean = false; // if false then it is a reference property
    implementedInBase: boolean = false;
    // @ts-ignore
    private $type: MetaElementReference<FreMetaClassifier>;
    // @ts-ignore
    private _owningClassifier: FreMetaClassifier;
    // @ts-ignore
    originalOwningClassifier: FreMetaClassifier;
    get owningClassifier() {
        return this._owningClassifier;
    }
    set owningClassifier(c: FreMetaClassifier) {
        if (this._owningClassifier === undefined || this._owningClassifier === null) {
            this._owningClassifier = c;
            this.originalOwningClassifier = c;
        } else {
            // this.originalOwningClassifier = this._owningClassifier;
            this._owningClassifier = c;
        }
    }
    get language(): FreMetaLanguage {
        return this.originalOwningClassifier.originalOwningLanguage;
    }

    get isPrimitive(): boolean {
        return this.type instanceof FreMetaPrimitiveType;
    }
    get type(): FreMetaClassifier {
        return this.$type?.referred;
    }
    set type(t: FreMetaClassifier) {
        this.$type = MetaElementReference.create<FreMetaClassifier>(t, "FreClassifier");
        this.$type.owner = this;
    }
    get typeReference(): MetaElementReference<FreMetaClassifier> {
        // only used by FreLanguageChecker and FreTyperChecker
        return this.$type;
    }
    set typeReference(t: MetaElementReference<FreMetaClassifier>) {
        // only used by FreLanguageChecker and FreTyperChecker
        this.$type = t;
        this.$type.owner = this;
    }
    toFreString(): string {
        return this.name + ": " + this.$type.name + `${this.isList ? `[]` : ``}`;
    }
}

export class FreMetaConceptProperty extends FreMetaProperty {
    // TODO Is never set , why the comment?
    hasLimitedType: boolean = false; // set in checker
    initial: FreMetaPrimitiveValue | undefined;
}

export class FreMetaPrimitiveProperty extends FreMetaProperty {
    isStatic: boolean = false;
    initialValueList: FreMetaPrimitiveValue[] = [];

    get isPrimitive(): boolean {
        return true;
    }

    get initialValue(): FreMetaPrimitiveValue {
        return this.initialValueList[0];
    }

    set initialValue(value: FreMetaPrimitiveValue) {
        this.initialValueList[0] = value;
    }
}

export class FreMetaInstance extends FreMetaLangElement {
    // @ts-ignore
    concept: MetaElementReference<FreMetaConcept>; // should be a limited concept
    // Note that these properties may be undefined, when there is no definition in the .ast file
    props: FreMetaInstanceProperty[] = [];

    nameProperty(): FreMetaInstanceProperty | undefined {
        return this.props.find((p) => p.name === "name");
    }
}

export class FreMetaInstanceProperty extends FreMetaLangElement {
    // @ts-ignore
    owningInstance: MetaElementReference<FreMetaInstance>;
    // @ts-ignore
    property: MetaElementReference<FreMetaProperty>;
    valueList: FreMetaPrimitiveValue[] = [];

    get value(): FreMetaPrimitiveValue {
        return this.valueList[0];
    }

    set value(newV) {
        this.valueList[0] = newV;
    }
}

// the following two classes are only used in the typer and validator definitions
export class FreMetaFunction extends FreMetaLangElement {
    // @ts-ignore
    language: FreMetaLanguage;
    formalparams: FreMetaParameter[] = [];
    // @ts-ignore
    returnType: MetaElementReference<FreMetaConcept>;
}

export class FreMetaParameter extends FreMetaLangElement {
    // @ts-ignore
    type: MetaElementReference<FreMetaConcept>;
}

export class FreMetaEnumValue extends FreMetaDefinitionElement {
    sourceName: string;
    instanceName: string;

    constructor(limitedConceptName: string, limitedInstanceName: string, location: ParseLocation) {
        super();
        this.sourceName = limitedConceptName;
        this.instanceName = limitedInstanceName;
        this.location = location;
    }

    toString(): string {
        return this.sourceName + ":" + this.instanceName;
    }
}
// the basic types in the Fre-languages
export type FreMetaPrimitiveValue = string | boolean | number | FreMetaEnumValue;

export class FreMetaPrimitiveType extends FreMetaConcept {
    /**
     * A convenience method that creates an instance of this class
     * based on the properties defined in 'data'.
     * @param data
     */
    static create(data: Partial<FreMetaPrimitiveType>): FreMetaPrimitiveType {
        const result = new FreMetaPrimitiveType();
        if (!!data.name) {
            result.name = data.name;
        }
        return result;
    }

    static string: FreMetaPrimitiveType = FreMetaPrimitiveType.create({ name: "string" });
    static number: FreMetaPrimitiveType = FreMetaPrimitiveType.create({ name: "number" });
    static boolean: FreMetaPrimitiveType = FreMetaPrimitiveType.create({ name: "boolean" });
    static identifier: FreMetaPrimitiveType = FreMetaPrimitiveType.create({ name: "identifier" });
    static $freAny: FreMetaPrimitiveType; // default predefined instance

    static find(name: string) {
        switch (name) {
            case "string":
                return this.string;
            case "boolean":
                return this.boolean;
            case "identifier":
                return this.identifier;
            case "number":
                return this.number;
        }
        return this.$freAny;
    }

    allSubConceptsRecursive(): FreMetaConcept[] {
        return [];
    }
    allSubConceptsDirect(): FreMetaConcept[] {
        return [];
    }
}

// export function isBinaryExpression(elem: FreMetaLangElement): elem is FreMetaBinaryExpressionConcept {
//     return elem instanceof FreMetaBinaryExpressionConcept;
// }
//
// export function isExpression(elem: FreMetaLangElement): elem is FreMetaExpressionConcept {
//     return elem instanceof FreMetaExpressionConcept;
// }
//
// export function isLimited(elem: FreMetaLangElement): elem is FreMetaLimitedConcept {
//     return elem instanceof FreMetaLimitedConcept;
// }
