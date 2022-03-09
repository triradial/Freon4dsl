import { PiDefinitionElement } from "../../utils";
import { PiClassifier, PiElementReference, PiLanguage } from "../../languagedef/metalanguage";
import { PitAnyTypeRule } from "./PitAnyTypeRule";
import { PitClassifierRule } from "./PitClassifierRule";

export class PiTyperDef extends PiDefinitionElement {
    /**
     * A convenience method that creates an instance of this class
     * based on the properties defined in 'data'.
     * @param data
     */
    static create(data: Partial<PiTyperDef>): PiTyperDef {
        const result = new PiTyperDef();
        if (!!data.location) {
            result.location = data.location;
        }
        if (!!data.anyTypeRule) {
            result.anyTypeRule = data.anyTypeRule;
        }
        if (!!data.classifierRules) {
            data.classifierRules.forEach(x => result.classifierRules.push(x));
        }
        if (!!data.types) {
            data.types.forEach(x => result.types.push(x));
        }
        if (!!data.conceptsWithType) {
            data.conceptsWithType.forEach(x => result.conceptsWithType.push(x));
        }
        if (!!data.__types_references) {
            data.__types_references.forEach(x => result.__types_references.push(x));
        }
        if (!!data.__conceptsWithType_references) {
            data.__conceptsWithType_references.forEach(x => result.__conceptsWithType_references.push(x));
        }
        return result;
    }
    name: string; // temporarily added to conform to PiLangElement TODO remove when scoping changes
    language: PiLanguage;
    __types_references: PiElementReference<PiClassifier>[] = [];
    __conceptsWithType_references: PiElementReference<PiClassifier>[] = [];
    anyTypeRule?: PitAnyTypeRule;
    classifierRules: PitClassifierRule[] = [];

    toPiString(): string {
        return `
        typer
        istype { ${this.__types_references.map( t => t.name ).join(", ")} }
        hastype { ${this.__conceptsWithType_references.map( t => t.name ).join(", ") } }
        ${this.anyTypeRule.toPiString()}
        ${this.classifierRules.map(r => r.toPiString()).join("\n")}`
    }

    get types(): PiClassifier[] {
        const result: PiClassifier[] = [];
        for (const ref of this.__types_references) {
            if (!!ref.referred) {
                result.push(ref.referred);
            }
        }
        return result;
    }

    set types(newTypes: PiClassifier[]) {
        this.__types_references = [];
        newTypes.forEach(t => {
            const xx = PiElementReference.create<PiClassifier>(t, "PiClassifier");
            xx.owner = this.language;
            this.__types_references.push(xx);
        });
    }

    get conceptsWithType(): PiClassifier[] {
        const result: PiClassifier[] = [];
        for (const ref of this.__conceptsWithType_references) {
            if (!!ref.referred) {
                result.push(ref.referred);
            }
        }
        return result;
    }

    set conceptsWithType(newTypes: PiClassifier[]) {
        this.__conceptsWithType_references = [];
        newTypes.forEach(t => {
            const xx = PiElementReference.create<PiClassifier>(t, "PiClassifier");
            xx.owner = this.language;
            this.__conceptsWithType_references.push(xx);
        });
    }
}
