import { type FreNode, type FreNamedNode, FreNodeReference, FreNamespaceInfo, type FreScoper, FreCompositeScoper } from "@freon4dsl/core";
export declare class CustomStudyConfigurationModelScoper implements FreScoper {
    mainScoper: FreCompositeScoper;
    getVisibleNodes(_node: FreNode | FreNodeReference<FreNamedNode>, _metaType?: string): FreNamedNode[];
    importedNamespaces(_node: FreNode): FreNamespaceInfo[];
    alternativeNamespaces(_node: FreNode): FreNamespaceInfo[];
}
//# sourceMappingURL=CustomStudyConfigurationModelScoper.d.ts.map