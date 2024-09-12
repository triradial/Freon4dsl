import { RHSPropEntry } from "./RHSPropEntry.js";
import { FreMetaProperty } from "../../../../languagedef/metalanguage/index.js";
import { getTypeCall, makeIndent } from "../GrammarUtils.js";
import { GenerationUtil } from "../../../../utils/index.js";
import { internalTransformNode, ParserGenUtil } from "../../ParserGenUtil.js";

export class RHSPartEntry extends RHSPropEntry {
    private readonly projectionName: string = "";

    constructor(prop: FreMetaProperty, projectionName: string) {
        super(prop);
        this.isList = false;
        this.projectionName = projectionName;
    }

    toGrammar(): string {
        return `${getTypeCall(this.property.type, this.projectionName)}` + this.doNewline();
    }

    toMethod(index: number, nodeName: string, mainAnalyserName: string): string {
        GenerationUtil.getBaseTypeAsString(this.property);
        // tslint:disable-next-line:max-line-length
        return `${ParserGenUtil.internalName(this.property.name)} = this.${mainAnalyserName}.${internalTransformNode}(${nodeName}[${index}]); // RHSPartEntry\n`;
    }

    toString(depth: number): string {
        const indent = makeIndent(depth);
        return indent + "RHSPartEntry: " + this.property.name;
    }
}
