import { AST } from "../change-manager/index.js";
import { FreEditor } from "../editor/index.js";
import { FreOwnerDescriptor, FreNode, FreExpressionNode } from "../ast/index.js";
import { isFreExpression } from "../ast-utils/index.js";
import { IdProvider } from "./IdProvider.js";
import { SimpleIdProvider } from "./SimpleIdProvider.js";

// export type BooleanCallback = () => boolean;
// export type DynamicBoolean = BooleanCallback | boolean;

// export const wait = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// export const NBSP: string = "".concat("\u00A0");

// const LOGGER = new FreLogger("FreUtils");

export class FreUtils {
    // Default generators initialized below the class declaration
    static nodeIdProvider: IdProvider = new SimpleIdProvider("ID-");
    static boxIdProvider: IdProvider;

    /**
     * Resets the ID providers to the built-in ones. The same ID can now appear twice.
     * Use only in tests to ensure the IDs there always start at 0.
     */
    static resetId(): void {
        this.nodeIdProvider = new SimpleIdProvider("ID-");
        this.boxIdProvider = new SimpleIdProvider("BOX-");
    }
    /**
     * Returns a new unique ID for a {@link FreNode} by delegating to {@link nodeIdProvider}.
     */
    static ID(): string {
        return this.nodeIdProvider.newId();
    }
    /**
     * Returns a new unique ID for a {@link Box} by delegating to {@link boxIdProvider}
     */
    static BOX_ID(): string {
        return this.boxIdProvider.newId();
    }
    /** Initialize an object with a JSON object
     */
    static initializeObject<TTarget, TSource>(target: TTarget, source: TSource) {
        if (!(target && source)) {
            return;
        }
        Object.keys(source).forEach((key) => {
            if (source.hasOwnProperty(key)) {
                (target as any)[key] = (source as any)[key];
            }
        });
    }

    static CHECK(b: boolean, msg?: string): void {
        if (!b) {
            throw new Error(msg ? "FAILED Check: " + msg : "check error");
        }
    }

    static setContainer(exp: FreNode, freOwnerDescriptor: FreOwnerDescriptor | null, editor: FreEditor): void {
        AST.change( () => {
            if ( !isNullOrUndefined(freOwnerDescriptor)) {
                if (freOwnerDescriptor.propertyIndex === undefined) {
                    freOwnerDescriptor.owner[freOwnerDescriptor.propertyName] = exp;
                } else {
                    freOwnerDescriptor.owner[freOwnerDescriptor.propertyName][freOwnerDescriptor.propertyIndex] = exp;
                }
            } else {
                editor.rootElement = exp;
            }
        });
    }

    static replaceExpression(oldExpression: FreExpressionNode, newExpression: FreExpressionNode, editor: FreEditor) {
        FreUtils.CHECK(
            isFreExpression(oldExpression),
            "replaceExpression: old element should be a FreExpressionNode, but it isn't",
        );
        FreUtils.CHECK(
            isFreExpression(newExpression),
            "replaceExpression: new element should be a FreExpressionNode, but it isn't",
        );
        AST.change( () => {
            FreUtils.setContainer(newExpression, oldExpression.freOwnerDescriptor(), editor);
        })
    }
}

// Initialize the default ID providers
FreUtils.resetId();

export function isNullOrUndefined(obj: Object | null | undefined): obj is null | undefined {
    return obj === undefined || obj === null;
}

export function startWithUpperCase(word: string): string {
    if (!!word) {
        return word[0].toUpperCase() + word.substring(1);
    }
    return "";
}
