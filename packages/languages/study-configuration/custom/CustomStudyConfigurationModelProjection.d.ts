import { type FreNode, Box, type FreProjection, type FreTableDefinition, FreProjectionHandler } from "@freon4dsl/core";
export declare class CustomStudyConfigurationModelProjection implements FreProjection {
    name: string;
    handler: FreProjectionHandler;
    nodeTypeToBoxMethod: Map<string, (node: FreNode) => Box>;
    nodeTypeToTableDefinition: Map<string, () => FreTableDefinition>;
}
//# sourceMappingURL=CustomStudyConfigurationModelProjection.d.ts.map