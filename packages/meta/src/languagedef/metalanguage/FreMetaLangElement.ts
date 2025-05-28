import { FreMetaDefinitionElement } from '../../utils/FreMetaDefinitionElement.js';

// root of the inheritance structure of all elements in a language definition
export abstract class FreMetaLangElement extends FreMetaDefinitionElement {
    protected _name: string = "";
    sourceFileName: string = "";
    sourceLineNumber: number = -1;
    sourceColumnNumber: number = -1;

    get name(): string {
        return this._name;
    }
    set name(v: string) {
        this._name = v;
    }
} 