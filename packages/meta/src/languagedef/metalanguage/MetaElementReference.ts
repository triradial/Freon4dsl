import { FreMetaLangElement } from "./internal.js";

/**
 * Implementation for a (named) reference in Freon.
 * Reference can be set with either a referred object, or with a unitName.
 */
export class MetaElementReference<T extends FreMetaLangElement> {
    static create<T extends FreMetaLangElement>(referred: T, typeName: string): MetaElementReference<T> {
        const result = new MetaElementReference<T>(referred, typeName);
        return result;
    }

    referred: T;
    typeName: string;
    owner!: FreMetaLangElement;

    private constructor(referred: T, typeName: string) {
        this.referred = referred;
        this.typeName = typeName;
    }
}
