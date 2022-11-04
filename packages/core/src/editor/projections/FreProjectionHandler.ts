import { Box, BoxFactory } from "../boxes";
import { isNullOrUndefined } from "../../util";
import { PiElement } from "../../ast";
import { FreBoxProvider } from "./FreBoxProvider";
import { FreProjection } from "./FreProjection";
import { action, makeObservable, observable } from "mobx";
import { ListUtil } from "../../util/ListUtil";

/**
 * This class, of which there should be one instance per editor, registers all
 * custom projections (of type FreProjection), and all box providers (of type
 * FreBoxProvider). There are the two main methods 'getBox', and 'getTableDefinition'.
 *
 * Based on these registrations it is determined which of these should create the box,
 * or tableDefinition for a certain element. Note that, because box providers have a
 * one-to-one relationship with nodes (of type PiElement), it is always the box provider
 * that ultimately returns the requested box/tableDefinition.
 */
export class FreProjectionHandler {
    // 'elementToProvider' stores the boxprovider that is servicing a certain node (of type PiElement).
    private elementToProvider: Map<string, FreBoxProvider> =
        new Map<string, FreBoxProvider>();
    // 'conceptNameToProviderConstructor' holds a list of box provider constructors,
    // such that the right box provider can be instantiated for a certain (type of) PiElement node.
    private conceptNameToProviderConstructor: Map<string, (h: FreProjectionHandler) => FreBoxProvider> =
        new Map<string, (h: FreProjectionHandler) => FreBoxProvider>([]);
    // '_allProjections' holds the list of names of all available projections, including all custom ones
    private _allProjections: string[] = [];
    // '_enabledProjections' holds the list of names of all enabled projections
    private _enabledProjections: string[] = [];
    // '_customProjections' holds the list of all custom projections (not only the names but the projections themselves!)
    private _customProjections: FreProjection[] = [];

    constructor() {
        /* The function enableProjections is a mobx action in order for all box providers to
        determine their contents in one go, thus resulting in only one (big) change in
        the web application.
         */
        makeObservable<FreProjectionHandler>(this, {
            enableProjections: action
        });
    }

    /////////// The main methods ///////////

    /**
     * Returns a box for 'element'. Which box is returned is determined by the enabled projections.
     * Internally, one of the box providers in 'elementToProvider' is used.
     * @param element
     */
    getBox(element: PiElement): Box {
        try {
            if (isNullOrUndefined(element)) {
                throw Error('FreProjectionHandler.getBox: element is null/undefined');
            }
        } catch (e) {
            console.error(e.stack);
            return null;
        }
        return this.getBoxProvider(element)?.box;
    }

    /**
     * Returns a table definition for type 'conceptName'. Which table definition is returned
     * is determined by the enabled projections.
     * Internally, a tempory box provider for type 'conceptName' is used.
     * @param conceptName
     */
    // getTableDefinition(conceptName: string): PiTableDefinition {
    //     console.log('FreProjectionHandler getTableDefinition ' + conceptName)
    //     const boxProvider = this.conceptNameToProviderConstructor.get(conceptName)(this);
    //     let tableDef = boxProvider?.tableDefinition;
    //     if (!!tableDef) {
    //         return tableDef;
    //     } else {
    //         // return default values if nothing has been found.
    //         return {
    //             headers: [conceptName],
    //             cells: [(element: PiElement) => {
    //                 return this.getBox(element);
    //             }]
    //         };
    //     }
    // }

    ////////// Methods for registring the boxproviders ////////////

    /**
     * Method that initilizes the property 'conceptNameToProviderConstructor'.
     * @param constructorMap
     */
    initProviderConstructors(constructorMap: Map<string, () => FreBoxProvider>) {
        this.conceptNameToProviderConstructor = constructorMap;
    }

    /**
     * Returns a box provider for element. Either it is newly created or it is found in
     * 'this.elementToProvider'.
     * @param element
     */
    getBoxProvider(element: PiElement): FreBoxProvider {
        if (isNullOrUndefined(element)) {
            console.error("FreProjectionHandler.getBoxProvider: element is null/undefined");
            return null;
        }

        // return if present, else create a new provider based on the language concept
        let boxProvider = this.elementToProvider.get(element.piId());
        if (isNullOrUndefined(boxProvider)) {
            boxProvider = this.conceptNameToProviderConstructor.get(element.piLanguageConcept())(this);
            this.elementToProvider.set(element.piId(), boxProvider);
            boxProvider.element = element;
            boxProvider.initUsedProjection(this.enabledProjections());
        }
        return boxProvider;
    }

    //////////// Methods for registring the projections ///////////

    /**
     * Adds the name of a projection
     * @param p
     */
    addProjection(p: string) {
        ListUtil.addIfNotPresent(this._allProjections, p);
        if (p !== 'default') {
            ListUtil.addIfNotPresent(this._enabledProjections, p);
        }
    }

    /**
     * Sets all projections whose name is in 'names' to be enabled.
     * @param names
     */
    enableProjections(names: string[]) {
        BoxFactory.clearCaches();
        // Because priority needs to be taken into account, we loop over all projections
        // in order to get the order of enabled projections correct.
        // This assumes that 'this._allProjections' always has the right order or priorities.
        const newList: string[] = [];
        for (const proj of this._allProjections) {
            if (names.includes(proj)) {
                newList.push(proj);
            }
        }
        this._enabledProjections = newList;
        console.log(" ============== enabled projections: " + this._enabledProjections);

        //  Let all providers know that projection may be changed.
        for (const provider of this.elementToProvider.values()) {
            provider.checkUsedProjection(this.enabledProjections());
        }
    }

    /**
     * Returns the names of all known projections.
     */
    projectionNames(): string[] {
        return this._allProjections;
    }

    /**
     * Returns the names of enabled projections.
     */
    enabledProjections(): string[] {
        return this._enabledProjections;
    }

    //////// Methods for custom projections ///////////

    /**
     * Returns the set of all custom projections.
     */
    get customProjections() : FreProjection[] {
        return this._customProjections;
    }

    /**
     * Adds a single custom projection.
     * @param p
     */
    addCustomProjection(p: FreProjection) {
        ListUtil.addIfNotPresent(this._customProjections, p);
        this.addProjection(p.name);
    }

    /**
     * Method that executes the function to create a box for 'element' that is registered
     * in the property 'nodeTypeToBoxMethod' of the custom projection named 'projectionName'.
     * @param element
     * @param projectionName
     */
    executeCustomProjection(element: PiElement, projectionName: string): Box {
        let BOX: Box = null;
        let customFuction: (node: PiElement) => Box = null;
        const customToUse = this.customProjections.find(cp => cp.name === projectionName);
        if (!!customToUse) {
            // bind(customToUse) binds the projection 'customToUse' to the 'this' variable, for use within the custom function
            customFuction = customToUse.nodeTypeToBoxMethod.get(element.piLanguageConcept())?.bind(customToUse);
        }

        if (!!customFuction) {
            BOX = customFuction(element);
        }
        return BOX;
    }

    /**
     * Method that executes the function to create a table definition for 'element' that is registered
     * in the property 'nodeTypeToTableDefinition' of the custom projection named 'projectionName'.
     * @param element
     * @param projectionName
     */
    // executeCustomTableDefinition(element: PiElement, projectionName: string): PiTableDefinition {
    //     let DEF: PiTableDefinition = null;
    //     let customFuction: () => PiTableDefinition = null;
    //     const customToUse = this.customProjections.find(cp => cp.name === projectionName);
    //     if (!!customToUse) {
    //         // bind(customToUse) binds the projection 'customToUse' to the 'this' variable, for use within the custom function
    //         customFuction = customToUse.nodeTypeToTableDefinition.get(element.piLanguageConcept())?.bind(customToUse);
    //     }
    //
    //     if (!!customFuction) {
    //         DEF = customFuction();
    //     }
    //     return DEF;
    // }
}
