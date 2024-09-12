// Generated by the Freon Language Generator.
import { FreNode, FreNamedNode, FreScoper, FreScoperComposite } from "@freon4dsl/core";

/**
 * Class 'CustomEntityModelScoper' is meant to be a convient place to add any
 * custom code for scoping.
 */
export class CustomEntityModelScoper implements FreScoper {
    mainScoper: FreScoperComposite;

    resolvePathName(modelelement: FreNode, doNotSearch: string, pathname: string[], metatype?: string): FreNamedNode {
        return undefined;
    }

    isInScope(modelElement: FreNode, name: string, metatype?: string, excludeSurrounding?: boolean): boolean {
        return undefined;
    }

    getVisibleElements(modelelement: FreNode, metatype?: string, excludeSurrounding?: boolean): FreNamedNode[] {
        return undefined;
    }

    getFromVisibleElements(modelelement: FreNode, name: string, metatype?: string, excludeSurrounding?: boolean): FreNamedNode {
        return undefined;
    }

    getVisibleNames(modelelement: FreNode, metatype?: string, excludeSurrounding?: boolean): string[] {
        return undefined;
    }

    additionalNamespaces(element: FreNode): FreNode[] {
        return undefined;
    }
}
