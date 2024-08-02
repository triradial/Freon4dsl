// This file contains all methods to connect the webapp to the Freon generated language editorEnvironment and to the server that stores the models
import { FreError, FreErrorSeverity, FreLogger, InMemoryModel } from "@freon4dsl/core"
import type { FreEnvironment, FreNode, FreModel, FreModelUnit, FreOwnerDescriptor, IServerCommunication } from "@freon4dsl/core";
import { get } from "svelte/store";
import {
    currentModelName,
    currentUnitName,
    editorProgressShown,
    noUnitAvailable,
    units,
    unitNames
} from "../components/stores/ModelStore.js";
import { setUserMessage } from "../components/stores/UserMessageStore.js";
import { modelErrors } from "../components/stores/InfoPanelStore.js";
import { runInAction } from "mobx";
import {WebappConfigurator} from "../WebappConfigurator.js";
import {StudyConfigurationModel, Period, StudyConfiguration} from "@freon4dsl/samples-study-configuration";

const LOGGER = new FreLogger("EditorState").mute();

export class EditorState {
    private static instance: EditorState | null = null;

    static getInstance(): EditorState {
        if (EditorState.instance === null) {
            EditorState.instance = new EditorState();
        }
        return EditorState.instance;
    }

    modelStore: InMemoryModel
    modelChanged = (store: InMemoryModel): void => {
        LOGGER.log("modelChanged")
        currentModelName.set(store?.model?.name)
        unitNames.set(store.getUnitIdentifiers());
        units.set(store.getUnits())
    }
    
    private constructor() {
            this.modelStore = new InMemoryModel(this.langEnv, this.serverCommunication)
        this.modelStore.addCurrentModelListener(this.modelChanged)
    }
    
    private __currentUnit: FreModelUnit = null;
    get currentUnit(): FreModelUnit {
        return this.__currentUnit
    }
    set currentUnit(unit: FreModelUnit) {
        this.__currentUnit = unit
        currentUnitName.set({name: this?.currentUnit?.name, id: this?.currentUnit?.freId()});
    }
    
    get currentModel(): FreModel {
        return this.modelStore.model
    }
    private langEnv: FreEnvironment = WebappConfigurator.getInstance().editorEnvironment;
    private serverCommunication: IServerCommunication = WebappConfigurator.getInstance().serverCommunication;

    /**
     * Creates a new model
     * @param modelName
     */
    async newStudyConfigurationModelUnits() {
        let newModel: StudyConfigurationModel = this.currentModel;
        // let config: StudyConfiguration = newModel.configuration;
        this.createNewUnit("StudyConfiguration", "StudyConfiguration");
        let studyConfigUnit = newModel.findUnit("StudyConfiguration");
        let defaultPeriod = new Period();
        defaultPeriod.name = "Default";
        LOGGER.log("before push periods length:"+studyConfigUnit.periods.length);
        studyConfigUnit.periods.push(defaultPeriod);
        LOGGER.log("config.periods length after:"+studyConfigUnit.periods.length)
        this.saveCurrentUnit();
        this.createNewUnit("Availability", "Availability");
        this.saveCurrentUnit();

        EditorState.getInstance().currentUnit = studyConfigUnit;        
        currentModelName.set(this.currentModel.name); //TODO: Why wasn't this in the original code?
    }

    /**
     * Creates a new model
     * @param modelName
     */
    async newModel(modelName: string) {
        LOGGER.log("new model called: " + modelName);
        editorProgressShown.set(true);
        // save the old current unit, if there is one
        await this.saveCurrentUnit();
        // reset all visible information on the model and unit
        this.resetGlobalVariables();
        // create a new model
        await this.modelStore.createModel(modelName);
        this.newStudyConfigurationModelUnits();
        editorProgressShown.set(false);
    }
    
    /**
     * Reads the model with name 'modelName' from the server and makes this the current model.
     * The first unit in the model is shown, if present.
     * @param modelName
     */
    async openModel(modelName: string) {
        LOGGER.log("EditorState.openmodel(" + modelName + ")");
        editorProgressShown.set(true);
        this.resetGlobalVariables();
        // save the old current unit, if there is one
        await this.saveCurrentUnit();
        // create new model instance in memory and set its name
        await this.modelStore.openModel(modelName)
        const unitIdentifiers = this.modelStore.getUnitIdentifiers()
        LOGGER.log("unit identifiers: " + JSON.stringify(unitIdentifiers));
        if (!!unitIdentifiers && unitIdentifiers.length > 0) {
            // load the first unit completely and show it
            let first: boolean = true;
            for (const unitIdentifier of unitIdentifiers) {
                if (first) {
                    const unit = this.modelStore.getUnitByName(unitIdentifier.name)
                    LOGGER.log("UnitId " + unitIdentifier.name + " unit is " + unit?.name)
                    this.currentUnit = unit;
                    first = false;
                }
            }
            EditorState.getInstance().showUnitAndErrors(this.currentUnit);
        } else {
            editorProgressShown.set(false);
        }

    }

    /**
     * When another model is shown in the editor this function is called.
     * It resets a series of global variables.
     * @private
     */
    private resetGlobalVariables() {
        noUnitAvailable.set(true);
        units.set([]);
        modelErrors.set([]);
    }

    /**
     * Adds a new unit to the current model and shows it in the editor
     * @param newName
     * @param unitType
     */
    async newUnit(newName: string, unitType: string) {
        LOGGER.log("EditorCommuncation.newUnit: unitType: " + unitType + ", name: " + newName);
        editorProgressShown.set(true);
        // save the old current unit, if there is one
        await this.saveCurrentUnit();
        await this.createNewUnit(newName, unitType)
    }

    /**
     * Because of the asynchronicity the true work of creating a new unit is done by this function
     * which is called at various points in the code.
     * @param newName
     * @param unitType
     * @private
     */
    private async createNewUnit(newName: string, unitType: string) {
        LOGGER.log("private createNewUnit called, unitType: " + unitType + " name: " + newName);
        const newUnit = await this.modelStore.createUnit(newName, unitType)
        if (!!newUnit) {
            newUnit.name = newName;
            // show the new unit in the editor
            this.showUnitAndErrors(newUnit);
        } else {
            setUserMessage(`Model unit of type '${unitType}' could not be created.`);
        }
    }

    /**
     * Pushes the current unit to the server
     */
    async saveCurrentUnit() {
        LOGGER.log("saveCurrentUnit: " + get(currentUnitName)?.name);
        const unit: FreModelUnit = this.langEnv.editor.rootElement as FreModelUnit;
        if (!!unit) {
            if (!!this.currentModel?.name && this.currentModel?.name?.length) {
                if (!!unit.name && unit.name.length > 0) {
                    await this.modelStore.saveUnit(unit)
                    currentUnitName.set({ name: unit.name, id: unit.freId() }); // just in case the user has changed the name in the editor
                } else {
                    setUserMessage(`Unit without name cannot be saved. Please, name it and try again.`);
                }
            } else {
                LOGGER.log("Internal error: cannot save unit because current model is unknown.");
            }
        } else {
            LOGGER.log("No current model unit");
        }
    }

    /**
     * Pushes the current unit to the server
     */
    async saveStudyUnits() {
        LOGGER.log("EditorState.saveCurrentUnit: " + get(currentUnitName));
        const unit: FreModelUnit = this.langEnv.editor.rootElement as FreModelUnit;
        if (!!unit) {
            if (!!this.currentModel?.name && this.currentModel?.name?.length) {
                if (!!unit.name && unit.name.length > 0) {
                    // await this.serverCommunication.putModelUnit(this.currentModel.name, unit.name, unit); MV
                    await this.modelStore.saveUnit(unit)
                    //TODO: find how to save these again by getting the units
                    // await this.serverCommunication.putModelUnit(this.currentModel.name, "Availability", this.currentModel.findUnit("Availability"));
                    LOGGER.log("Unit saved: Availability");
                    // await this.serverCommunication.putModelUnit(this.currentModel.name, "StudyConfiguration", this.currentModel.findUnit("StudyConfiguration") );
                    LOGGER.log("Unit saved: StudyConfiguration");
                    currentUnitName.set({ name: unit.name, id: unit.freId() }); // just in case the user has changed the name in the editor
                    EditorState.getInstance().setUnitLists();
                } else {
                    setUserMessage(`Unit without name cannot be saved. Please, name it and try again.`);
                }
            } else {
                LOGGER.log("Internal error: cannot save unit because current model is unknown.");
            }
        } else {
            LOGGER.log("No current model unit");
        }
    }

    async renameModelUnit(unit: FreModelUnit, newName: string) {
        console.log("Units before: " + this.currentModel.getUnits().map((u: FreModelUnit) => u.name));
        const oldName: string = unit.name;
        unit.name = newName;
        // TODO Use model store
        this.serverCommunication.renameModelUnit(this.currentModel.name, oldName, newName, unit);
        console.log("Units after: " + this.currentModel.getUnits().map((u: FreModelUnit) => u.name));
    }

    /**
     * Deletes the unit 'unit', from the server and from the current in-memory model
     * @param unit
     */
    async deleteModelUnit(unit: FreModelUnit) {
        LOGGER.log("delete called for unit: " + unit.name);

        // get rid of the unit on the server
        await this.modelStore.deleteUnit(unit)
        // if the unit is shown in the editor, get rid of that one, as well
        if (this.currentUnit.freId() === unit.freId()) {
            this.langEnv.editor.rootElement = null;
            noUnitAvailable.set(true);
            modelErrors.set([]);
        }
        // get rid of the name in the navigator
        currentUnitName.set({name: "", id: "???"});
    }

    /**
     * Whenever there is a change in the units of the current model,
     * this function is called. It sets the store variable 'units' to the
     * right value.
     * @private
     */
    private setUnitLists() {
        LOGGER.log("setUnitLists");
        const unitsInModel = this.currentModel.getUnits();
        unitNames.set(unitsInModel.map(u => ({name: u.name, id: u.freId()})));
        units.set(unitsInModel);
    }

    /**
     * Reads the unit called 'newUnit' from the server and shows it in the editor
     * @param newUnit
     */
    async openModelUnit(newUnit: FreModelUnit) {
        LOGGER.log("openModelUnit called, unitName: " + newUnit.name);
        // TODO currentUnitName is not updated properly
        if (!!this.currentUnit && newUnit.name === this.currentUnit.name) {
            // the unit to open is the same as the unit in the editor, so we are doing nothing
            LOGGER.log("openModelUnit doing NOTHING");
            return;
        }
        // save the old current unit, if there is one
        await this.saveCurrentUnit();
        this.showUnitAndErrors(newUnit);
    }

    /**
     * Parses the string 'content' to create a model unit. If the parsing is ok,
     * then the unit is added to the current model.
     * @param content
     * @param metaType
     */
    async unitFromFile(fileName: string, content: string, metaType: string, showIt: boolean) {
        // save the old current unit, if there is one
        this.saveCurrentUnit();
        let unit: FreModelUnit = null;
        try {
            // the following also adds the new unit to the model
            unit = this.langEnv.reader.readFromString(content, metaType, this.currentModel, fileName) as FreModelUnit;
            if (!!unit) {
                // if the element does not yet have a name, try to use the file name
                if (!unit.name || unit.name.length === 0) {
                    unit.name = this.makeUnitName(fileName);
                }
                if (showIt) {
                    // set elem in editor
                    this.showUnitAndErrors(unit);
                }
                await this.modelStore.addUnit(unit)
            }
        } catch (e: unknown) {
            if (e instanceof Error) {
                setUserMessage(e.message, FreErrorSeverity.Error);
            }
        }
    }

    private makeUnitName(fileName: string): string {
        const nameExist: boolean = !!this.currentModel.getUnits().find((existing: FreModelUnit) => existing.name === fileName);
        if (nameExist) {
            setUserMessage(`Unit named '${fileName}' already exists, adding number.`, FreErrorSeverity.Error);
            // find the existing names that start with the file name
            const unitsWithSimiliarName = this.currentModel.getUnits().filter((existing: FreModelUnit) => existing.name.startsWith(fileName));
            if (unitsWithSimiliarName.length > 1) { // there are already numbered units
                // find the biggest number that is in use after the filename, e.g. Home12, Home3 => 12
                let biggestNr: number = 1;
                // find the characters in each of the existing names that come after the file name
                const trailingParts: string[] = unitsWithSimiliarName.map((existing: FreModelUnit) => existing.name.slice(fileName.length));
                trailingParts.forEach(trailing => {
                    const nextNumber: number = Number.parseInt(trailing, 10);
                    if (!isNaN(nextNumber) && nextNumber >= biggestNr) {
                        biggestNr = nextNumber + 1;
                    }
                });
                return fileName + biggestNr;
            } else {
                return fileName + "1";
            }
        } else {
            return fileName;
        }
    }

    /**
     * This function takes care of actually showing the new unit in the editor
     * and getting the validation errors, if any, and show them in the error list.
     * @param newUnit
     * @private
     */
    private showUnitAndErrors(newUnit: FreModelUnit) {
        LOGGER.log("showUnitAndErrors called, unitName: " + newUnit?.name);
        if (!!newUnit) {
            noUnitAvailable.set(false);
            this.langEnv.editor.rootElement = newUnit;
            this.currentUnit = newUnit;
            this.getErrors();
        } else {
            noUnitAvailable.set(true);
            this.langEnv.editor.rootElement = null;
            this.currentUnit = null;
        }
        editorProgressShown.set(false);
    }

    /**
     * When an error in the errorlist is selected, or a search result is selected, the editor jumps to the faulty element.
     * @param item
     */
    selectElement(item: FreNode, propertyName?: string) {
        LOGGER.log("Item selected");
        this.langEnv.editor.selectElement(item, propertyName);
    }

    /**
     * Runs the validator for the current unit
     */
    getErrors() {
        LOGGER.log("EditorState.getErrors() for " + this.currentUnit.name);
        if (!!this.currentUnit) {
            try {
                const list = this.langEnv.validator.validate(this.currentUnit);
                modelErrors.set(list);
            } catch (e: unknown) { // catch any errors regarding erroneously stored model units
                if (e instanceof Error) {
                    LOGGER.log(e.message);
                    modelErrors.set([new FreError("Problem reading model unit: '" + e.message + "'",
                        this.currentUnit,
                        this.currentUnit.name,
                        FreErrorSeverity.Error)
                    ]);
                }
            }
        }
    }

    deleteElement(tobeDeleted: FreNode) {
        if (!!tobeDeleted) {
            // find the owner of the element to be deleted and remove the element there
            const owner: FreNode = tobeDeleted.freOwner();
            const desc: FreOwnerDescriptor = tobeDeleted.freOwnerDescriptor();
            if (!!desc) {
                // console.log("deleting " + desc.propertyName + "[" + desc.propertyIndex + "]");
                if (desc.propertyIndex !== null && desc.propertyIndex !== undefined && desc.propertyIndex >= 0) {
                    const propList = owner[desc.propertyName];
                    if (Array.isArray(propList) && propList.length > desc.propertyIndex) {
                        runInAction(() =>
                            propList.splice(desc.propertyIndex, 1)
                        );
                    }
                } else {
                    runInAction(() =>
                        owner[desc.propertyName] = null
                    );
                }
            } else {
                console.error("deleting of " + tobeDeleted.freId() + " not succeeded, because owner descriptor is empty.");
            }
        }
    }

    pasteInElement(element: FreNode, propertyName: string, index?: number) {
        const property = element[propertyName];
        // todo make new copy to keep in 'this.langEnv.editor.copiedElement'
        if (Array.isArray(property)) {
            // console.log('List before: [' + property.map(x => x.freId()).join(', ') + ']');
            runInAction(() => {
                    if (index !== null && index !== undefined && index > 0) {
                        property.splice(index, 0, this.langEnv.editor.copiedElement);
                    } else {
                        property.push(this.langEnv.editor.copiedElement);
                    }
                }
            );
            // console.log('List after: [' + property.map(x => x.freId()).join(', ') + ']');
        } else {
            // console.log('property ' + propertyName + ' is no list');
            runInAction(() =>
                element[propertyName] = this.langEnv.editor.copiedElement
            );
        }
    }
}
