import { FreNode } from "../../ast";
import {
    BoolDisplay,
    BooleanWrapperBox,
    Box,
    BoxFactory,
    ButtonBox,
    EmptyLineBox,
    ExternalBooleanBox,
    ExternalNumberBox,
    ExternalPartBox,
    ExternalPartListBox,
    ExternalRefBox,
    ExternalRefListBox,
    ExternalStringBox,
    HorizontalListBox,
    IndentBox,
    LabelBox,
    LimitedControlBox,
    LimitedDisplay,
    NumberDisplay,
    NumberDisplayInfo,
    NumberWrapperBox,
    PartListWrapperBox,
    PartWrapperBox,
    ReferenceBox,
    RefListWrapperBox,
    RefWrapperBox,
    SelectBox,
    StringWrapperBox,
    TextBox,
    VerticalListBox, 
    MultiLineTextBox2, 
    ItemGroupBox, 
    ItemGroupBox2, 
    ListGroupBox, 
} from "../boxes";
import { FreScoper } from "../../scoper";
import { RoleProvider } from "./RoleProvider";
import { FreProjectionHandler } from "../projections";
import { UtilPrimHelper } from "./box-util-helpers/UtilPrimHelper";
import { UtilRefHelpers } from "./box-util-helpers/UtilRefHelpers";
import { UtilPartHelpers } from "./box-util-helpers/UtilPartHelpers";
import { UtilLimitedHelpers } from "./box-util-helpers/UtilLimitedHelpers";

/** Start - M+G */
import {FreUtils} from "../../util";
import {BehaviorExecutionResult} from "../util";
import { runInAction } from "mobx";
/**End - M+G */

export class FreListInfo {
    text: string;
    type: string;
}

/**
 * This class is the interface to a number of classes that help create the right boxes for a FreNode model.
 */
export class BoxUtil {
    static separatorName: string = "Separator";
    static terminatorName: string = "Terminator";
    static initiatorName: string = "Initiator";
    static readonly BEGIN_CHAR = "<";
    static readonly END_CHAR = ">";

    /**
     * Returns an empty line box to be used in the projection of 'node'.
     * @param node
     * @param role
     */
    public static emptyLineBox(node: FreNode, role: string): EmptyLineBox {
        return new EmptyLineBox(node, role);
    }

    /**
     * Returns a label box which holds some static text (i.e. 'content') to be included in the projection of 'node'.
     * @param node
     * @param content
     * @param uid
     * @param initializer
     */
    public static labelBox(node: FreNode, content: string, uid: string, initializer?: Partial<LabelBox>): LabelBox {
        const roleName: string = RoleProvider.label(node, uid) + "-" + content;
        return BoxFactory.label(node, roleName, content, initializer);
    }

    /**
     * Returns an indent box which provide the required indentation for its 'childBox', to be included in the projection of 'node'.
     * @param node
     * @param indent
     * @param uid
     * @param childBox
     * @param initializer
     */
    public static indentBox(
        node: FreNode,
        indent: number,
        uid: string,
        childBox: Box,
        initializer?: Partial<IndentBox>,
    ): IndentBox {
        return BoxFactory.indent(node, RoleProvider.indent(node, uid), indent, childBox, initializer);
    }

    /**
     * Returns a button box to be included in the projection of 'node'.
     * @param node
     * @param text
     * @param roleName
     * @param initializer
     */
    public static buttonBox(
        node: FreNode,
        text: string,
        roleName: string,
        initializer?: Partial<ButtonBox>,
    ): ButtonBox {
        return BoxFactory.button(node, text, roleName, initializer);
    }

    /**
     * Returns a textBox for a property named 'propertyName' within 'node' of type 'string' or 'identifier'.
     * When the property is a list (the type is "string[]", or "identifier[]"), this method can be
     * called for each item in the list. In that case an index to the item needs to be provided.
     * @param node the owning FreNode of the displayed property
     * @param propertyName the name of the displayed property
     * @param index the index of the item in the list, if the property is a list
     */
    public static textBox(node: FreNode, propertyName: string, index?: number): TextBox {
        return UtilPrimHelper.textBox(node, propertyName, index);
    }

    /**
     * Returns a textBox for a property named 'propertyName' within 'node' of type 'number'.
     * When the property is a list (the type is "number[]"), this method can be
     * called for each item in the list. In that case an index to the item needs to be provided.
     * @param node the owning FreNode of the displayed property
     * @param propertyName the name of the displayed property
     * @param display
     * @param index the index of the item in the list, if the property is a list
     * @param displayInfo
     */
    public static numberBox(
        node: FreNode,
        propertyName: string,
        display: NumberDisplay,
        index?: number,
        displayInfo?: NumberDisplayInfo,
    ): Box {
        return UtilPrimHelper.numberBox(node, propertyName, display, index, displayInfo);
    }

    /**
     * Returns a textBox for a property named 'propertyName' within 'node' of type 'boolean'.
     * When the property is a list (the type is "boolean[]"), this method can be
     * called for each item in the list. In that case an index to the item needs to be provided.
     * @param node the owning FreNode of the displayed property
     * @param propertyName the name of the displayed property
     * @param labels the different texts to be shown when the property is false or true
     * @param kind
     * @param index the index of the item in the list, if the property is a list
     * */
    public static booleanBox(
        node: FreNode,
        propertyName: string,
        labels: { yes: string; no: string } = {
            yes: "yes",
            no: "no",
        },
        kind: BoolDisplay,
        index?: number,
    ): Box {
        return UtilPrimHelper.booleanBox(node, propertyName, labels, kind, index);
    }

    /**
     * Returns a box to display the property named 'propertyName' of 'node' that is a single limited value. If the
     * display type is RADIO_GROUP then a LimitedControlBox is returned. If the display type is SELECT, then a
     * SelectBox is returned.
     * @param node
     * @param propertyName
     * @param setFunc           a function to make a reference to a single limited value/instance
     * @param display
     * @param scoper
     * @param index
     */
    public static limitedBox(
        node: FreNode,
        propertyName: string,
        setFunc: (selected: string) => void,
        display: LimitedDisplay,
        scoper?: FreScoper,
        index?: number
    ): LimitedControlBox | SelectBox {
        return UtilLimitedHelpers.limitedBox(node, propertyName, setFunc, display, scoper, index);
    }

    /**
     * Returns a LimitedControlBox to display the property named 'propertyName' of 'node' that is a list of limited values,
     * as a checkbox control.
     * Note that a list of limited values can also be displayed as a list of reference boxes, which is handled in
     * different methods of this class ('this.verticalReferenceListBox(...)' and 'this.horizontalReferenceListBox(...)').
     * Which method needs to be chosen depends on the display type provided.
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
        return UtilLimitedHelpers.limitedListBox(node, propertyName, setFunc, display);
    }

    /**
     * Returns a VerticalListBox for a property named 'propertyName' within 'node' that is a list of parts
     * (the type is "SOME_CONCEPT_OR_INTERFACE[]").
     * For every element in the list its box is found in the 'boxProviderCache'. Based on the listInfo, separators, etc. are added.
     * All these boxes are added to the 'children' of the returned box. As last child an ActionBox is added that
     * functions as placeholder for creating new elements in the list.
     * @param node
     * @param list
     * @param propertyName
     * @param listJoin
     * @param boxProviderCache
     * @param initializer
     */
    public static verticalPartListBox(
        node: FreNode,
        list: FreNode[],
        propertyName: string,
        listJoin: FreListInfo,
        boxProviderCache: FreProjectionHandler,
        initializer?: Partial<VerticalListBox>,
    ): VerticalListBox {
        return UtilPartHelpers.verticalPartListBox(node, list, propertyName, listJoin, boxProviderCache, initializer);
    }

    /**
     * Returns a HorizontalListBox for a property named 'propertyName' within 'node' that is a list of parts
     * (the type is "SOME_CONCEPT_OR_INTERFACE[]").
     * For every element in the list its box is found in the 'boxProviderCache'. Based on the listInfo, separators, etc. are added.
     * All these boxes are added to the 'children' of the returned box. As last child an ActionBox is added that
     * functions as placeholder for creating new elements in the list.
     * @param node
     * @param list
     * @param propertyName
     * @param listJoin
     * @param boxProviderCache
     * @param initializer
     */
    public static horizontalPartListBox(
        node: FreNode,
        list: FreNode[],
        propertyName: string,
        listJoin: FreListInfo,
        boxProviderCache: FreProjectionHandler,
        initializer?: Partial<HorizontalListBox>,
    ): HorizontalListBox {
        return UtilPartHelpers.horizontalPartListBox(node, list, propertyName, listJoin, boxProviderCache, initializer);
    }

    /**
     * Returns a selectBox for a property named 'propertyName' within 'node' that is a reference
     * (the type is "reference SOME_CONCEPT_OR_INTERFACE", or "reference SOME_CONCEPT_OR_INTERFACE[]").
     * It calls the 'scoper' to fill a dropdown list with possible values for the reference property.
     * A function that is able to set the property (based on the value selected from the dropdown list)
     * has to be provided.
     *
     * When the property is a list (the type is "reference SOMECONCEPT_OR_INTERFACE[]"), this method can be
     * called for each item in the list. In that case an index to the item needs to be provided.
     * @param node the owning FreNode of the displayed property
     * @param propertyName the name of the displayed property
     * @param setFunc
     * @param scoper
     * @param index
     */
    public static referenceBox(
        node: FreNode,
        propertyName: string,
        setFunc: (selected: string) => void,
        scoper: FreScoper,
        index?: number,
    ): ReferenceBox {
        return UtilRefHelpers.referenceBox(node, propertyName, setFunc, scoper, index);
    }

    /**
     * Returns a VerticalListBox for a property named 'propertyName' within 'node' that is a list of references
     * (the type is "reference SOME_CONCEPT_OR_INTERFACE[]").
     * For every element in the list a referenceBox is created. Based on the listInfo, separators, etc. are added.
     * All these boxes are added to the 'children' of the returned box. As last child an ActionBox is added that
     * functions as placeholder for creating new elements in the list.
     * @param node
     * @param propertyName
     * @param scoper
     * @param isLimited
     * @param listInfo
     * @param initializer
     */
    public static verticalReferenceListBox(
        node: FreNode,
        propertyName: string,
        scoper: FreScoper,
        isLimited: boolean,
        listInfo?: FreListInfo,
        initializer?: Partial<VerticalListBox>,
    ): VerticalListBox {
        return UtilRefHelpers.verticalReferenceListBox(node, propertyName, scoper, isLimited, listInfo, initializer);
    }

    /**
     * Returns a HorizontalListBox for a property named 'propertyName' within 'node' that is a list of references
     * (the type is "reference SOME_CONCEPT_OR_INTERFACE[]").
     * For every element in the list a referenceBox is created. Based on the listInfo, separators, etc. are added.
     * All these boxes are added to the 'children' of the returned box. As last child an ActionBox is added that
     * functions as placeholder for creating new elements in the list.
     * @param node
     * @param propertyName
     * @param scoper
     * @param isLimited
     * @param listJoin
     * @param initializer
     */
    public static horizontalReferenceListBox(
        node: FreNode,
        propertyName: string,
        scoper: FreScoper,
        isLimited: boolean,
        listJoin?: FreListInfo,
        initializer?: Partial<HorizontalListBox>,
    ): HorizontalListBox {
        return UtilRefHelpers.horizontalReferenceListBox(node, propertyName, scoper, isLimited, listJoin, initializer);
    }


    /**
     * Returns a textBox for a property named 'propertyName' within 'node', either the box that is already present in
     * the 'boxProviderCache', or an ActionBox by means of which a new value for this property can be created. The 'conceptName'
     * is needed to known what type of value needs to be created.
     * @param node
     * @param propertyName
     * @param conceptName
     * @param boxProviderCache
     */
    public static getBoxOrAction(
        node: FreNode,
        propertyName: string,
        conceptName: string,
        boxProviderCache: FreProjectionHandler,
    ): Box {
        // find the information on the property to be shown
        const property = node[propertyName];
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName);
        let result: Box = !!property
            ? boxProviderCache.getBoxProvider(property).box
            : BoxFactory.action(node, roleName, BoxUtil.BEGIN_CHAR + "choose" + BoxUtil.END_CHAR, { // M+G Update 
            // : BoxFactory.action(node, roleName, `<${propertyName}>`, {
                propertyName: propertyName,
                conceptName: conceptName,
            });
        result.propertyName = propertyName;
        // result.propertyIndex = ??? todo
        return result;
    }

    /**
     * Returns an ExternalRefListBox for a property named 'propertyName' within 'node' that is a list of references
     * (the type is "reference SOME_CONCEPT_OR_INTERFACE[]").
     * For every element in the list a normal box is created. All these boxes are added to the 'children' of the
     * returned box. No separators, etc., or placeholder ActionBox are added.
     * @param node
     * @param propertyName
     * @param externalComponentName
     * @param scoper
     * @param initializer
     */
    public static externalReferenceListBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        scoper: FreScoper,
        initializer?: Partial<ExternalRefListBox>,
    ): ExternalRefListBox {
        return UtilRefHelpers.externalReferenceListBox(node, propertyName, externalComponentName, scoper, initializer);
    }

    /**
     * Returns an ExternalPartListBox for a property named 'propertyName' within 'node' that is a list of parts
     * (the type is "SOME_CONCEPT_OR_INTERFACE[]").
     * For every element in the list a normal box is created. All these boxes are added to the 'children' of the
     * returned box. No separators, etc., or placeholder ActionBox are added.
     * @param node
     * @param list
     * @param propertyName
     * @param externalComponentName
     * @param boxProviderCache
     * @param initializer
     */
    public static externalPartListBox(
        node: FreNode,
        list: FreNode[],
        propertyName: string,
        externalComponentName: string,
        boxProviderCache: FreProjectionHandler,
        initializer?: Partial<ExternalPartListBox>,
    ): ExternalPartListBox {
        return UtilPartHelpers.externalPartListBox(
            node,
            list,
            propertyName,
            externalComponentName,
            boxProviderCache,
            initializer,
        );
    }

    // TODO get the role names correct in the following methods
    // TODO use caches for following methods
    static externalStringBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        initializer?: Partial<ExternalStringBox>,
    ): ExternalStringBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-external";
        return new ExternalStringBox(externalComponentName, node, roleName, propertyName, initializer);
    }

    static externalNumberBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        initializer?: Partial<ExternalNumberBox>,
    ): ExternalNumberBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-external";
        return new ExternalNumberBox(externalComponentName, node, roleName, propertyName, initializer);
    }

    static externalBooleanBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        initializer?: Partial<ExternalBooleanBox>,
    ): ExternalBooleanBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-external";
        return new ExternalBooleanBox(externalComponentName, node, roleName, propertyName, initializer);
    }

    static externalPartBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        initializer?: Partial<ExternalPartBox>,
    ): ExternalPartBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-external";
        return new ExternalPartBox(externalComponentName, node, roleName, propertyName, initializer);
    }

    static externalRefBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        initializer?: Partial<ExternalRefBox>,
    ): ExternalRefBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-external";
        return new ExternalRefBox(externalComponentName, node, roleName, propertyName, initializer);
    }

    static stringWrapperBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        childBox: Box,
        initializer?: Partial<StringWrapperBox>,
    ): StringWrapperBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-wrapper";
        return new StringWrapperBox(externalComponentName, node, roleName, propertyName, childBox, initializer);
    }

    static numberWrapperBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        childBox: Box,
        initializer?: Partial<NumberWrapperBox>,
    ): NumberWrapperBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-wrapper";
        return new NumberWrapperBox(externalComponentName, node, roleName, propertyName, childBox, initializer);
    }

    static booleanWrapperBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        childBox: Box,
        initializer?: Partial<BooleanWrapperBox>,
    ): BooleanWrapperBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-wrapper";
        return new BooleanWrapperBox(externalComponentName, node, roleName, propertyName, childBox, initializer);
    }

    static partWrapperBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        childBox: Box,
        initializer?: Partial<PartWrapperBox>,
    ): PartWrapperBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-wrapper";
        return new PartWrapperBox(externalComponentName, node, roleName, propertyName, childBox, initializer);
    }

    static partListWrapperBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        childBox: Box,
        initializer?: Partial<PartListWrapperBox>,
    ): PartListWrapperBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-wrapper";
        return new PartListWrapperBox(externalComponentName, node, roleName, propertyName, childBox, initializer);
    }

    static refWrapperBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        childBox: Box,
        initializer?: Partial<RefWrapperBox>,
    ): RefWrapperBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-wrapper";
        return new RefWrapperBox(externalComponentName, node, roleName, propertyName, childBox, initializer);
    }
    static refListWrapperBox(
        node: FreNode,
        propertyName: string,
        externalComponentName: string,
        childBox: Box,
        initializer?: Partial<RefListWrapperBox>,
    ): RefListWrapperBox {
        const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName) + "-wrapper";
        return new RefListWrapperBox(externalComponentName, node, roleName, propertyName, childBox, initializer);
    }

/** START - M+G */
    static listGroupBox(node: FreNode, roleName: string, label: string, childBox: Box, initializer?: Partial<ListGroupBox>): ListGroupBox {
        const role = this.makeKeyName(roleName);
        const updatedInitializer = {
            ...initializer,
            selectable: initializer?.selectable ?? true,
            isExpanded: initializer?.isExpanded ?? false,
            canAdd: initializer?.canAdd ?? false,
            canCRUD: initializer?.canCRUD ?? false,            
        }  
        let result: ListGroupBox = BoxFactory.listGroup(node, role, label, childBox, updatedInitializer );
        return result;
    }

    static itemGroupBox(node: FreNode, roleName: string, label: string, propertyName: string, childBox: Box, initializer?: Partial<ItemGroupBox>): ItemGroupBox {
        let result: ItemGroupBox = null;
        let ph: string = BoxUtil.formatPlaceholder(initializer?.placeHolder, propertyName);
        const role = this.makeKeyName(roleName);
        const updatedInitializer = {
            ...initializer,
            selectable: initializer?.selectable ?? true,
            isExpanded: initializer?.isExpanded ?? false,
            isDraggable: initializer?.isDraggable ?? true,
            canDelete: initializer?.canDelete ?? true,
            canDuplicate: initializer?.canDuplicate ?? false,
            canShare: initializer?.canShare ?? false,
            canUnlink: initializer?.canUnlink ?? false,
            canCRUD: initializer?.canCRUD ?? false,
            canEdit: initializer?.canEdit ?? true,
            placeHolder: ph,
        }  
        const property = node[propertyName];
        if (property !== undefined && property !== null && typeof property === "string") {
            //const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName, "textbox");
            result = BoxFactory.itemGroup(node, role, label, () => node[propertyName], (v: string) => runInAction( () => { (node[propertyName] = v); }), childBox, updatedInitializer );
            result.propertyName = propertyName;
        } else {
            FreUtils.CHECK(false, "Property " + propertyName + " does not exist or is not a string: " + property + "\"");
        }
        return result;
    }

    static itemGroupBox2(node: FreNode, roleName: string, label: string, propertyName: string, propType: string, setFunc: (selected: string) => void, scoper: FreScoper, childBox: Box, initializer?: Partial<ItemGroupBox2>): ItemGroupBox2 {
        let result: ItemGroupBox2 = null;
        //const propType: string = FreLanguage.getInstance().classifierProperty(node.freLanguageConcept(), propertyName)?.type;
        let ph: string = BoxUtil.formatPlaceholder(initializer?.placeHolder, propertyName);
        const role = this.makeKeyName(roleName);
        const updatedInitializer = {
            ...initializer,
            selectable: initializer?.selectable ?? true,
            isExpanded: initializer?.isExpanded ?? false,
            isDraggable: initializer?.isDraggable ?? true,
            canDelete: initializer?.canDelete ?? true,
            canUnlink: initializer?.canUnlink ?? false,
            canExpand: initializer?.canExpand ?? true,
            placeHolder: ph,
        }  
        const property = node[propertyName];
        result = BoxFactory.itemGroup2( node, role, label,
            () => { return scoper.getVisibleNames(node, propType) .filter(name => !!name && name !== "") .map(name => ({ id: name, label: name })); },
            () => { if (!!property) { return { id: property.name, label: property.name }; } else { return null; }},
            // @ts-ignore
            (editor: FreEditor, option: SelectOption): BehaviorExecutionResult => {
                if (!!option) { 
                    runInAction(() => {setFunc(option.label);});} 
                else {
                    runInAction(() => { node[propertyName] = null;});
                }
                return BehaviorExecutionResult.EXECUTED;
            }, childBox,
            updatedInitializer
        );
        result.propertyName = propertyName;
        //result.propertyIndex = index;
        return result;
    }

    /**
     * Returns a textBox for property named 'propertyName' within 'element'.
     * When the property is a list (the type is "string[]", or "identifier[]"), this method can be
     * called for each item in the list. In that case an index to the item needs to be provided.
     * @param node the owning FreNode of the displayed property
     * @param propertyName the name of the displayed property
     * @param index the index of the item in the list, if the property is a list
     */
    static multiLineTextBox(node: FreNode, propertyName: string, index?: number, initializer?: Partial<MultiLineTextBox2>): MultiLineTextBox2 {
        let result: MultiLineTextBox2 = null;
        const updatedInitializer = {
            selectable: initializer?.selectable ?? true,
            placeHolder: BoxUtil.formatPlaceholder(initializer?.placeHolder, initializer?.propertyName),
            ...initializer
        } 
        const property = node[propertyName];
        // create the box
        if (property !== undefined && property !== null && typeof property === "string") {
            const roleName: string = RoleProvider.property(node.freLanguageConcept(), propertyName, "MultiLineTextBox2", index);
            result = BoxFactory.multitext( node, roleName, () => node[propertyName], (v: string) => runInAction( () => { (node[propertyName] = v); }), updatedInitializer );
            result.propertyName = propertyName;
            result.propertyIndex = index;
        } else {
            FreUtils.CHECK(false, "Property " + propertyName + " does not exist or is not a string: " + property + "\"");
        }
        return result;
    }

    static emptyLineBox2(node: FreNode, role: string, cssClass?: string): EmptyLineBox {
        const updatedInitializer: Partial<EmptyLineBox>  = {
            cssClass: cssClass
        }
        return new EmptyLineBox(node, role, updatedInitializer);
    }

    static switchElement(element: FreNode, id: string, label: string): Box {
        return BoxFactory.horizontalLayout(element, id + 'group', "",
            [
                this.booleanBox(element, id, { yes: "YES", no: "NO" }, BoolDisplay.SWITCH),
                this.labelBox(element, label, id +'_label'),
            ],
        { selectable: false, cssClass:"align-center" } );
    }

    static formatPlaceholder(placeholder: string | undefined, propertyname: string): string {
        return placeholder !== undefined ? `${BoxUtil.BEGIN_CHAR}${placeholder}${BoxUtil.END_CHAR}` : `${BoxUtil.BEGIN_CHAR}${propertyname}${BoxUtil.END_CHAR}`;
    }

    private static makeKeyName(value: string): string {
        return value.replace(/ /g, "-").toLowerCase();
    }

/** END - M+G */

}
