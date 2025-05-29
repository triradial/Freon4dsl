import { FreOwnerDescriptor, FreNode, FreNamedNode } from "../ast/index.js";
import { FreWriter } from "../writer/index.js";
import { FreType } from "./FreType.js";
import { FreParseLocation } from "../reader/index.js";

class NamedNode implements FreNamedNode {
    static environment: NamedNode;
    name: string = "ANY";
    parseLocation: FreParseLocation;

    /**
     * This method implements the singleton pattern
     */
    public static getInstance(): FreNamedNode {
        if (this.environment === undefined || this.environment === null) {
            this.environment = new NamedNode();
        }
        return this.environment;
    }

    /**
     * A private constructor, as demanded by the singleton pattern.
     */
    private constructor() {
        this.parseLocation = FreParseLocation.create({});
    }

    freOwner(): FreNode | undefined {
        return undefined;
    }

    freOwnerDescriptor(): FreOwnerDescriptor {
        // Create a self-referential dummy node to avoid undefined owner
        const dummyNode: FreNode = {
            freId: () => "",
            freIsBinaryExpression: () => false,
            freIsExpression: () => false,
            freIsModel: () => false,
            freIsUnit: () => false,
            freLanguageConcept: () => "DummyNode",
            freOwner: () => dummyNode,
            freOwnerDescriptor: () => ({ owner: dummyNode, propertyName: "", propertyIndex: 0 }),
            copy: () => dummyNode,
            match: (toBeMatched: Partial<FreNode>) => {
                return toBeMatched.freLanguageConcept?.() === "DummyNode";
            }
        };
        return { owner: dummyNode, propertyName: "", propertyIndex: 0 };
    }

    freId(): string {
        return "";
    }

    freIsBinaryExpression(): boolean {
        return false;
    }

    freIsExpression(): boolean {
        return false;
    }

    freIsModel(): boolean {
        return false;
    }

    freIsUnit(): boolean {
        return false;
    }

    freLanguageConcept(): string {
        return "NamedElement";
    }

    copy(): NamedNode {
        return this;
    }

    match(toBeMatched: Partial<NamedNode>): boolean {
        return toBeMatched.name === this.name;
    }
}

export class AstType implements FreType {
    parseLocation: FreParseLocation;
    astElement: FreNode;

    constructor(astElement: FreNode) {
        this.astElement = astElement;
        this.parseLocation = FreParseLocation.create({});
    }

    get ownerDescriptor(): FreOwnerDescriptor | undefined {
        if (this.astElement) {
            return this.astElement.freOwnerDescriptor();
        }
        return undefined;
    }

    get name(): string {
        if (this.astElement) {
            if ('name' in this.astElement && typeof this.astElement.name === 'string') {
                return this.astElement.name;
            }
        }
        return "unknown";
    }

    static create(data: Partial<AstType>): AstType {
        if (!data.astElement) {
            throw new Error("AstElement is required when creating an AstType");
        }
        const result: AstType = new AstType(data.astElement);
        return result;
    }

    static ANY: FreNamedNode = NamedNode.getInstance();
    static ANY_TYPE: AstType = AstType.create({ astElement: AstType.ANY });

    readonly $typename: string = "AstType";

    toFreString(writer: FreWriter): string {
        if (this.astElement) {
            if (this.astElement === AstType.ANY) {
                return "ANY";
            } else if ('name' in this.astElement && typeof this.astElement.name === 'string') {
                return writer.writeNameOnly(this.astElement);
            } else {
                return writer.writeToString(this.astElement);
            }
        }
        return "AstType[ unknown ]";
    }

    toAstElement(): FreNode {
        return this.astElement;
    }

    copy(): AstType {
        const result: AstType = new AstType(this.astElement);
        return result;
    }
}
