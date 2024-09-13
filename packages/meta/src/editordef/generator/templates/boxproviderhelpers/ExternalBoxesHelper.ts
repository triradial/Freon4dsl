import { FreEditPropertyProjection, FreEditSimpleExternal } from "../../../metalanguage/index.js";
import {
    FreMetaConceptProperty,
    FreMetaLanguage,
    FreMetaPrimitiveProperty,
    FreMetaProperty,
} from "../../../../languagedef/metalanguage/index.js";
import { ListUtil, Names } from "../../../../utils/index.js";
import { BoxProviderTemplate } from "../BoxProviderTemplate.js";

export class ExternalBoxesHelper {
    private _myTemplate: BoxProviderTemplate;

    constructor(myTemplate: BoxProviderTemplate) {
        this._myTemplate = myTemplate;
    }

    public generatePrimAsExternal(
        item: FreEditPropertyProjection,
        property: FreMetaPrimitiveProperty,
        elementVarName: string,
        innerResult: string,
    ): string {
        let result: string = "";
        if (!!item.externalInfo!.wrapBy && item.externalInfo!.wrapBy.length > 0) {
            // wrap the result in an ExternalBox
            if (!innerResult || innerResult.length === 0) {
                innerResult = "null";
            }
            result += this.wrapPrimByExternal(item, property, elementVarName, innerResult);
        } else {
            // replace the property box by an ExternalBox
            result += this.replacePrimByExternal(item, property, elementVarName);
        }
        return result;
    }

    public generateSingleAsExternal(
        item: FreEditPropertyProjection,
        property: FreMetaConceptProperty,
        elementVarName: string,
        innerResult: string,
    ): string {
        let result: string = "";
        if (!!item.externalInfo!.wrapBy && item.externalInfo!.wrapBy.length > 0) {
            // wrap the result in an ExternalBox
            if (!innerResult || innerResult.length === 0) {
                innerResult = "null";
            }
            result += this.wrapByExternal(item, property, elementVarName, innerResult);
        } else {
            // replace the property box by an ExternalBox
            result += this.replaceSingleByExternal(item, property, elementVarName);
        }
        return result;
    }

    public generateListAsExternal(
        item: FreEditPropertyProjection,
        property: FreMetaConceptProperty,
        elementVarName: string,
        innerResult: string,
        language: FreMetaLanguage,
    ): string {
        let result: string = "";
        if (!!item.externalInfo!.wrapBy && item.externalInfo!.wrapBy.length > 0) {
            // wrap the result in an ExternalBox
            if (!innerResult || innerResult.length === 0) {
                innerResult = "null";
            }
            result += this.wrapByExternal(item, property, elementVarName, innerResult);
        } else {
            // replace the property box by an ExternalBox
            result += this.replaceListByExternal(item, property, elementVarName, language);
        }
        return result;
    }

    public generateSimpleExternal(item: FreEditSimpleExternal, element: string, mainBoxLabel: string): string {
        // create role todo make sure this is the right role
        const myRole: string = `${mainBoxLabel}-simple-external-${item.name!}`;
        // build the initializer with parameters to the external component
        let initializer: string = "";
        if (!!item.params && item.params.length > 0) {
            initializer = `, { params: [${item.params.map((x) => `{key: "${x.key}", value: "${x.value}"}`).join(", ")}] }`;
        }
        ListUtil.addIfNotPresent(this._myTemplate.coreImports, "ExternalSimpleBox");
        return `new ExternalSimpleBox("${item.name}", ${element}, "${myRole}"${initializer})`;
    }

    private wrapByExternal(
        item: FreEditPropertyProjection,
        property: FreMetaProperty,
        elementVarName: string,
        innerResult: string,
    ): string {
        let initializer: string = this.buildInitializer(item);
        let methodName: string = "partWrapperBox";
        if (property.isPart && property.isList) {
            methodName = "partListWrapperBox";
        } else if (property.isPart && !property.isList) {
            methodName = "partWrapperBox";
        } else if (!property.isPart && property.isList) {
            methodName = "refListWrapperBox";
        } else if (!property.isPart && !property.isList) {
            methodName = "refWrapperBox";
        }
        return `BoxUtil.${methodName}(
                        ${elementVarName},
                        "${property.name}",
                        "${item.externalInfo!.wrapBy}",
                    ${innerResult},
                    ${initializer}
                    )`;
    }

    private replaceSingleByExternal(
        item: FreEditPropertyProjection,
        property: FreMetaConceptProperty,
        elementVarName: string,
    ): string {
        let initializer: string = this.buildInitializer(item);
        let methodName: string = "externalPartBox";
        if (!property.isPart) {
            methodName = "externalRefBox";
        }
        ListUtil.addIfNotPresent(this._myTemplate.coreImports, `BoxUtil`);
        return `BoxUtil.${methodName}(
                        ${elementVarName},
                        "${property.name}",
                        "${item.externalInfo!.replaceBy}"
                        ${initializer}
                    ),`;
    }

    private replaceListByExternal(
        item: FreEditPropertyProjection,
        property: FreMetaConceptProperty,
        elementVarName: string,
        language: FreMetaLanguage,
    ) {
        let initializer: string = this.buildInitializer(item);
        ListUtil.addIfNotPresent(this._myTemplate.coreImports, `BoxUtil`);
        if (property.isPart) {
            return `BoxUtil.externalPartListBox(
                        ${elementVarName},
                        ${elementVarName}.${property.name},
                        "${property.name}",
                        "${item.externalInfo!.replaceBy}",
                        this.mainHandler
                        ${initializer}
                    )`;
        } else {
            return `BoxUtil.externalReferenceListBox(
                        ${elementVarName},
                        "${property.name}",
                        "${item.externalInfo!.replaceBy}",
                        ${Names.environment(language)}.getInstance().scoper
                        ${initializer}
                    )`;
        }
    }

    private wrapPrimByExternal(
        item: FreEditPropertyProjection,
        propertyConcept: FreMetaProperty,
        elementVarName: string,
        innerBoxStr: string,
    ): string {
        let initializer: string = this.buildInitializer(item);
        let methodName: string = "stringWrapperBox";
        switch (propertyConcept.type.name) {
            case "boolean": {
                methodName = "booleanWrapperBox";
                break;
            }
            case "number": {
                methodName = "numberWrapperBox";
                break;
            }
        }
        ListUtil.addIfNotPresent(this._myTemplate.coreImports, `BoxUtil`);
        return `BoxUtil.${methodName}(
                        ${elementVarName},
                        "${propertyConcept.name}",
                        "${item.externalInfo!.wrapBy}",
                        ${innerBoxStr}
                        ${initializer}
                    )`;
    }

    private replacePrimByExternal(
        item: FreEditPropertyProjection,
        property: FreMetaPrimitiveProperty,
        elementVarName: string,
    ): string {
        let initializer: string = this.buildInitializer(item);
        let methodName: string = "externalStringBox";
        switch (property.type.name) {
            case "boolean": {
                methodName = "externalBooleanBox";
                break;
            }
            case "number": {
                methodName = "externalNumberBox";
                break;
            }
        }
        ListUtil.addIfNotPresent(this._myTemplate.coreImports, `BoxUtil`);
        return `BoxUtil.${methodName}(${elementVarName}, "${property.name}", "${item.externalInfo!.replaceBy}" ${initializer})`;
    }

    private buildInitializer(item: FreEditPropertyProjection) {
        // build the initializer with parameters to the external component
        let initializer: string = "";
        if (!!item.externalInfo!.params && item.externalInfo!.params.length > 0) {
            initializer = `, { params: [${item.externalInfo!.params.map((x) => `{key: "${x.key}", value: "${x.value}"}`).join(", ")}] }`;
        }
        return initializer;
    }
}
