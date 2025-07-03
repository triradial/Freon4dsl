import type { FreNode } from "../../../ast/index.js";
import { AST } from "../../../change-manager/index.js";
import {BoxFactory, LimitedControlBox, LimitedDisplay, SelectBox} from "../../boxes/index.js";
import type {SelectOption} from "../../boxes/index.js";
import { FreLanguage } from "../../../language/index.js";
import type { FreLanguageProperty } from "../../../language/index.js";
import { UtilCheckers } from "./UtilCheckers.js";
import { RoleProvider } from "../RoleProvider.js";
import type {FreScoper} from "../../../scoper/index.js";
import {FreEditor} from "../../FreEditor.js";
import {BehaviorExecutionResult} from "../../util/index.js";

export class UtilLimitedHelpers {

    public static limitedBox(
        node: FreNode,
        propertyName: string,
        setFunc: (selected: string) => void,
        display: LimitedDisplay,
        scoper?: FreScoper,
        index?: number
    ): LimitedControlBox | SelectBox {
        // find the information on the property to be shown
        const propInfo: FreLanguageProperty = FreLanguage.getInstance().classifierProperty(
            node.freLanguageConcept(),
            propertyName,
        );
        if (propInfo.isList) {
            throw new Error(
                "Cannot create a Limited box for '" + propertyName + "', because the set function is not correct",
            );
        } else if (display === LimitedDisplay.CHECKBOX) {
            throw new Error(
                "Cannot create a Checkbox Group box for '" + propertyName + "', because it is not a list value",
            );
        }
        if (display === LimitedDisplay.RADIO_BUTTON) {
            return this.limitedControlBox(node, propertyName, setFunc, propInfo);
        } else if (display === LimitedDisplay.SELECT) {
            return this.limitedSelectBox(node, propertyName, setFunc, scoper, index);
        } else {
            // should never occur
            throw new Error("Incorrect display type for limited value '" + propertyName + "'.");
        }
    }

    /**
     *
     * @param node
     * @param propertyName
     * @param setFunc           a function to make a reference to a single limited value/instance
     * @param display
     */
    public static limitedListBox(
        node: FreNode,
        propertyName: string,
        setFunc: (selected: string[]) => void,
        display: LimitedDisplay,
    ): LimitedControlBox {
        // find the information on the property to be shown
        const propInfo: FreLanguageProperty = FreLanguage.getInstance().classifierProperty(
            node.freLanguageConcept(),
            propertyName,
        );
        if (!propInfo.isList) {
            throw new Error(
                "Cannot create a Limited box for '" + propertyName + "', because the set function is not correct",
            );
        } else if (display === LimitedDisplay.RADIO_BUTTON) {
            throw new Error(
                "Cannot create a Radio Button box for '" + propertyName + "', because it is not a single value",
            );
        }
        const possibleValues: string[] = UtilCheckers.checkLimitedType(propInfo, propertyName);
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName, "limitedcontrolbox");
        let result: LimitedControlBox = BoxFactory.limited(
            node,
            roleName,
            () => node[propertyName].map((n) => n.name), // node[propertyName] is a list of references, therefore we need to get their names
            (v: string[]) =>
                AST.change(() => {
                    setFunc(v);
                }),
            possibleValues,
        );
        result.showAs = LimitedDisplay.CHECKBOX;
        result.propertyName = propertyName;
        return result;
    }

    private static limitedControlBox(
        node: FreNode,
        propertyName: string,
        setFunc: (selected: string) => void,
        propInfo: FreLanguageProperty
    ): LimitedControlBox {
        const possibleValues: string[] = UtilCheckers.checkLimitedType(propInfo, propertyName);

        console.log("[DEBUG] LimitedControlBox possibleValues for", propertyName, ":", possibleValues);

        // console.log(`BoxUtil.limitedBox for ${propertyName} current value is ` + [node[propertyName]] + ", possibleValues: [" + possibleValues + "]");
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName, "limitedcontrolbox");
        let result: LimitedControlBox = BoxFactory.limited(
            node,
            roleName,
            () => (node[propertyName] === null ? [] : [node[propertyName].name]),
            (v: string[]) => {
                    if (!!v[0]) {
                        // console.log("========> set property [" + propertyName + "] of " + node["name"] + " := " + v[0]);
                        AST.changeNamed(`Limited for property ${propertyName} set to ${v[0]}` , () => {
                            setFunc(v[0]);
                        });
                    } else {
                        AST.changeNamed(`Limited for property ${propertyName} set to null`, () => {
                            node[propertyName] = null;
                        });
                    }
                 },
            possibleValues,
        );
        result.showAs = LimitedDisplay.RADIO_BUTTON;
        result.propertyName = propertyName;
        return result;
    }

    private static limitedSelectBox(
        node: FreNode,
        propertyName: string,
        setFunc: (selected: string) => void,
        scoper?: FreScoper,
        index?: number,
    ): SelectBox {
        const propType: string = FreLanguage.getInstance().classifierProperty(
            node.freLanguageConcept(),
            propertyName,
        )?.type;
        if (!propType) {
            throw new Error("Cannot find property type '" + propertyName + "'");
        }
        let property = node[propertyName];
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName, "referencebox", index);
        // set the value for use in lists
        if (index !== null && index !== undefined && index >= 0) {
            property = property[index];
        }

        let result: SelectBox;
        result = BoxFactory.select(
            node,
            roleName,
            `<${propertyName}>`,
            () => {
                // Use the new instanceKeyNamePairs property if available
                const concept = FreLanguage.getInstance().concept(propType);
                let options: { id: string, label: string }[] = [];
                if (concept && Array.isArray(concept.instanceKeyNamePairs)) {
                    options = concept.instanceKeyNamePairs.map(({ key, name }: { key: string, name: string }) => ({
                        id: key,
                        label: name || key
                    }));
                } else if (scoper) {
                    // fallback: use scoper keys
                    options = scoper.getVisibleNames(node, propType)
                        .filter((key) => !!key && key !== "")
                        .map((key) => ({ id: key, label: key }));
                }
                return options;
            },
            () => {
                const concept = FreLanguage.getInstance().concept(propType);
                if (!!property && concept && Array.isArray(concept.instanceKeyNamePairs)) {
                    const found = concept.instanceKeyNamePairs.find((inst: { key: string }) => inst.key === property.name);
                    return found ? { id: found.key, label: found.name || found.key } : { id: property.name, label: property.name };
                } else if (!!property) {
                    return { id: property.name, label: property.name };
                } else {
                    return null;
                }
            },
            // @ts-ignore
            (editor: FreEditor, option: SelectOption): BehaviorExecutionResult => {
                if (!!option) {
                    AST.changeNamed(`UtilLimitedHelpers.limitedSelectBox for property ${propertyName} set to ${option.label}` , () => {
                        setFunc(option.label);
                    });
                } else {
                    AST.changeNamed(`UtilLimitedHelpers.limitedSelectBox for property ${propertyName}  set to null`, () => {
                        node[propertyName] = null;
                    });
                }
                return BehaviorExecutionResult.EXECUTED;
            },
            {},
        );
        result.propertyName = propertyName;
        result.propertyIndex = index;
        return result;
    }
}
