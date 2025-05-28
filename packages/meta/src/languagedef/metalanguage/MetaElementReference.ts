import { FreMetaBaseElement } from "../../utils/FreMetaBaseElement.js";

/**
 * Implementation for a (named) reference in Freon.
 * Reference can be set with either a referred object, or with a unitName.
 */
export class MetaElementReference<T extends FreMetaBaseElement> extends FreMetaBaseElement {
    referred!: T;  // Using definite assignment assertion
    name: string;
    type: string;
    owner?: FreMetaBaseElement;

    constructor(name: string, type: string) {
        super();
        this.name = name;
        this.type = type;
    }

    static create<T extends FreMetaBaseElement>(referred: T, type: string): MetaElementReference<T> {
        const result = new MetaElementReference<T>((referred as any).name, type);
        result.referred = referred;
        return result;
    }
}
