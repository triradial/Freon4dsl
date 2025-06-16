// This file contains all methods to connect the webapp to the Freon generated language editorEnvironment and to the server that stores the models
import { AST, BoxFactory, FreError, FreErrorSeverity, FreLogger, FreUndoManager, InMemoryModel, FreUtils } from "@freon4dsl/core";
import type { FreEnvironment, FreNode, FreModel, FreModelUnit, FreOwnerDescriptor, IServerCommunication } from "@freon4dsl/core";
import { runInAction } from "mobx";

import { get } from "svelte/store";
import { currentModelName, currentUnitName, editorProgressShown, noUnitAvailable, units, unitNames } from "./model-store.js";
import { setUserMessage } from "./usermessage-store.js";
import { modelErrors } from "./error-store.js";

import { WebappConfigurator } from "./webapp-configurator.js";

import { Event, Task, Period, StudyConfiguration } from "@freon4dsl/samples-study-configuration";

const LOGGER = new FreLogger("EditorState").mute();

export class ModelManager {
    private static instance: ModelManager | null = null;

    static getInstance(): ModelManager {
        if (ModelManager.instance === null) {
            ModelManager.instance = new ModelManager();
        }
        return ModelManager.instance;
    }

    modelStore: InMemoryModel;
    modelChanged = (store: InMemoryModel): void => {
        LOGGER.log("modelChanged");
        currentModelName.set(store?.model?.name);
        unitNames.set(store.getUnitIdentifiers());
        units.set(store.getUnits());
    };

    private constructor() {
        this.modelStore = new InMemoryModel(this.langEnv, this.serverCommunication);
        this.modelStore.addCurrentModelListener(this.modelChanged);
    }

    // todo see whether we can use only the editor.rootElement as currentUnit
    private currentUnit: FreModelUnit | undefined;

    getCurrentUnit(): FreModelUnit | undefined {
        return this.currentUnit;
    }
    setCurrentUnit(unit: FreModelUnit | undefined) {
        this.currentUnit = unit;
        if (unit) {
            FreUndoManager.getInstance().currentUnit = unit;
            currentUnitName.set({ name: this?.currentUnit?.name ?? "", id: this?.currentUnit?.freId() ?? "" });
        } else {
            currentUnitName.set({ name: "", id: "" });
        }
    }

    get currentModel(): FreModel {
        return this.modelStore.model;
    }
    private langEnv: FreEnvironment = WebappConfigurator.getInstance().editorEnvironment;
    private serverCommunication: IServerCommunication = WebappConfigurator.getInstance().serverCommunication;

    /**
     * Creates a new model
     */
    async createModel(modelName: string) {
        try {
            LOGGER.log("ModelHandler.createModel name: " + modelName);
            await this.saveCurrentUnit();
            this.resetGlobalVariables();
            await this.modelStore.createModel(modelName);
            if (modelName === "StudyConfiguration") {
                await this.createStudyConfigurationModelUnits();
                // } else if (modelName === "SomethingElse") {
                //     await this.createSomethingElseModelUnits();
            } else {
                LOGGER.info("ModelHandler.createModel units: none");
            }
        } catch (error) {
            LOGGER.error("Error in newModel: " + error);
        }
    }

    /**
     * Reads the model with name 'modelName' from the server and makes this the current model.
     * The first unit in the model is shown, if present.
     * @param modelName
     */
    async openModel(modelName: string) {
        // FreLogger.unmuteAllLogs();
        LOGGER.log("ModelManager.openModel(" + modelName + ")");
        console.log("ModelManager.openModel(" + modelName + ")");
        editorProgressShown.set(true);
        this.resetGlobalVariables();
        // save the old current unit, if there is one
        await this.saveCurrentUnit();
        // create new model instance in memory and set its name
        await this.modelStore.openModel(modelName);
        const unitIdentifiers = this.modelStore.getUnitIdentifiers();
        console.log("unit identifiers: " + JSON.stringify(unitIdentifiers));
        if (!!unitIdentifiers && unitIdentifiers.length > 0) {
            // load the first unit completely and show it
            let first: boolean = true;
            for (const unitIdentifier of unitIdentifiers) {
                console.log("unitIdentifier: " + unitIdentifier.name);
                if (first) {
                    const unit = this.modelStore.getUnitByName(unitIdentifier.name);
                    LOGGER.log("UnitId " + unitIdentifier.name + " unit is " + unit?.name);
                    this.setCurrentUnit(unit);
                    first = false;
                }
            }
            BoxFactory.clearCaches();
            this.langEnv.projectionHandler.clear();
            if (this.currentUnit) {
                this.showModelUnit(this.currentUnit);
            }
        } else {
            editorProgressShown.set(false);
        }
    }

    /**
     * Reads the model with name 'modelName' from the server and makes this the current model.
     * The named model unit is shown
     * @param modelName
     * @param unitName
     */
    async openModelUnit(modelName: string, unitName: string): Promise<FreModelUnit | undefined> {
        LOGGER.log("ModelHandler.openModelUnit modelName: " + modelName + " unitName: " + unitName);
        console.log("ModelHandler.openModelUnit modelName: " + modelName + " unitName: " + unitName);
        editorProgressShown.set(true);
        this.resetGlobalVariables();
        // save the old current unit, if there is one
        await this.saveCurrentUnit();
        // create new model instance in memory and set its name
        await this.modelStore.openModel(modelName);
        const unit = this.modelStore.getUnitByName(unitName);
        console.log("openModelUnit unit:", unit);
        if (unit) {
            this.setCurrentUnit(unit);
            BoxFactory.clearCaches();
            this.langEnv.projectionHandler.clear();
            this.showModelUnit(unit);
        }
        return unit;
    }

    async openModelUnitWithoutSavingCurrentUnit(modelName: string, unitName: string): Promise<FreModelUnit | undefined> {
        LOGGER.log("ModelHandler.openModelUnit modelName: " + modelName + " unitName: " + unitName);
        editorProgressShown.set(true);
        this.resetGlobalVariables();
        // save the old current unit, if there is one
        // await this.saveCurrentUnit();
        // create new model instance in memory and set its name
        await this.modelStore.openModel(modelName);
        const unit = this.modelStore.getUnitByName(unitName);
        console.log("openModelUnit unit:", unit);
        if (unit) {
            this.setCurrentUnit(unit);
            BoxFactory.clearCaches();
            this.langEnv.projectionHandler.clear();
            this.showModelUnit(unit);
        }
        return unit;
    }

    async displayModelUnit(unit: FreModelUnit) {
        LOGGER.log("ModelHandler.openModelUnitWithoutSavingCurrentUnit unit: " + unit.name);
        editorProgressShown.set(true);
        this.resetGlobalVariables();
        this.setCurrentUnit(unit);
        BoxFactory.clearCaches();
        this.langEnv.projectionHandler.clear();
        this.showModelUnit(unit);
    }

    /**
     * Parses the string 'content' to create a model unit. If the parsing is ok,
     * then the unit is added to the current model.
     * @param fileName
     * @param content
     * @param metaType
     */
    async openModelUnitFromFile(fileName: string, content: string, metaType: string, showIt: boolean) {
        this.saveCurrentUnit(); // save the old current unit, if there is one
        let unit: FreModelUnit;
        try {
            // the following also adds the new unit to the model
            unit = this.langEnv.reader.readFromString(content, metaType, this.currentModel, fileName) as FreModelUnit;
            if (!!unit) {
                // if the element does not yet have a name, try to use the file name
                if (!unit.name || unit.name.length === 0) {
                    unit.name = this.makeUnitNameFromFileName(fileName);
                }
                if (showIt) {
                    // set elem in editor
                    this.showModelUnit(unit);
                }
                await this.modelStore.addUnit(unit);
            }
        } catch (e: unknown) {
            if (e instanceof Error) {
                setUserMessage(e.message, FreErrorSeverity.Error);
            }
        }
    }

    /**
     * Adds a new unit to the current model and shows it in the editor
     * @param newName
     * @param unitType
     */
    async createModelUnit(newName: string, unitType: string) {
        LOGGER.log("EditorCommuncation.newUnit: unitType: " + unitType + ", name: " + newName);
        await this.saveCurrentUnit();
        await this.createNewUnit(newName, unitType);
    }

    /**
     * Reads the model with name 'modelName' from the server and makes this the current model.
     * The first unit in the model is shown, if present.
     * @param modelName
     */
    async deleteModel(modelName: string) {
        // FreLogger.unmuteAllLogs();
        LOGGER.log("ModelManager.deleteModel(" + modelName + ")");
        this.resetGlobalVariables();
        // save the old current unit, if there is one
        await this.saveCurrentUnit();
        // delete model instance in memory
        await this.modelStore.deleteModel(modelName);
    }

    /**
     * Creates model units for the StudyConfiguration model
     */
    private async createStudyConfigurationModelUnits() {
        try {
            LOGGER.info("ModelHandler.createModelUnits START name: StudyConfiguration");

            await this.createNewUnit("Availability", "Availability");
            await this.saveCurrentUnit();

            await this.createNewUnit("PatientInfo", "PatientInfo");
            await this.saveCurrentUnit();

            await this.createNewUnit("StudyConfiguration", "StudyConfiguration");

            LOGGER.info("ModelHandler.createModelUnits units: Availability, PatientInfo, StudyConfiguration");

            // Initialize the StudyConfiguration with a default period, event, and task in the checklist
            const studyConfigUnit: StudyConfiguration = this.modelStore.getUnitByName("StudyConfiguration") as StudyConfiguration;
            studyConfigUnit.periods.push(Period.create(Period.create({ name: "Screening" })));
            studyConfigUnit.periods[0].events.push(Event.create({ name: "Screen" }));
            studyConfigUnit.periods[0].events[0].tasks.push(Task.create({ name: "Task 1" }));
            await this.saveCurrentUnit();

            this.setCurrentUnit(studyConfigUnit);
            currentModelName.set(this.currentModel.name);

            LOGGER.info("ModelHandler.createModelUnits END name: StudyConfiguration");
        } catch (error: unknown) {
            if (error instanceof Error) {
                LOGGER.error("ModelHandler.createModelUnits ERROR: " + error.message);
                LOGGER.error("ModelHandler.createModelUnits ERROR: Stack trace: " + error.stack);
            } else {
                LOGGER.error("ModelHandler.createModelUnits ERROR: " + String(error));
            }
        }
    }

    /**
     * Pushes the current unit to the server
     */
    async saveCurrentUnit() {
        LOGGER.log("ModelHandler.saveCurrentUnit: " + get(currentUnitName)?.name);
        const unit: FreModelUnit = this.langEnv.editor.rootElement as FreModelUnit;
        if (!!unit) {
            if (!!this.currentModel?.name && this.currentModel?.name?.length) {
                if (!!unit.name && unit.name.length > 0) {
                    await this.modelStore.saveUnit(unit);
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
     * Because of the asynchronicity the true work of creating a new unit is done by this function
     * which is called at various points in the code.
     * @param newName
     * @param unitType
     * @private
     */
    async createNewUnit(newName: string, unitType: string) {
        LOGGER.log("private createNewUnit called, unitType: " + unitType + " name: " + newName);
        const newUnit = await this.modelStore.createUnit(newName, unitType);
        if (!!newUnit) {
            newUnit.name = newName;
            // show the new unit in the editor
            this.showModelUnit(newUnit);
        } else {
            setUserMessage(`Model unit of type '${unitType}' could not be created.`);
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
     * Pushes the current unit to the server
     */
    private async saveStudyUnits() {
        LOGGER.log("EditorState.saveCurrentUnit: " + get(currentUnitName));
        console.log("EditorState.saveCurrentUnit: " + get(currentUnitName));
        const unit: FreModelUnit = this.langEnv.editor.rootElement as FreModelUnit;
        if (!!unit) {
            if (!!this.currentModel?.name && this.currentModel?.name?.length) {
                if (!!unit.name && unit.name.length > 0) {
                    // await this.serverCommunication.putModelUnit(this.currentModel.name, unit.name, unit); MV
                    LOGGER.log("saveStudyUnits saving: " + unit.name);
                    console.log("saveStudyUnits saving: " + unit.name);
                    await this.modelStore.saveUnit(unit);
                    //TODO: find how to save these again by getting the units
                    // await this.serverCommunication.putModelUnit(this.currentModel.name, "Availability", this.currentModel.findUnit("Availability"));
                    // LOGGER.log("Unit saved: Availability");
                    // await this.serverCommunication.putModelUnit(this.currentModel.name, "StudyConfiguration", this.currentModel.findUnit("StudyConfiguration") );
                    // LOGGER.log("Unit saved: StudyConfiguration");
                    currentUnitName.set({ name: unit.name, id: unit.freId() }); // just in case the user has changed the name in the editor
                    this.setUnitLists();
                } else {
                    setUserMessage(`Unit without name cannot be saved. Please, name it and try again.`);
                }
            } else {
                console.log("Internal error: cannot save unit because current model is unknown.");
                LOGGER.log("Internal error: cannot save unit because current model is unknown.");
            }
        } else {
            console.log("No current model unit");
            LOGGER.log("No current model unit");
        }
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
        unitNames.set(unitsInModel.map((u) => ({ name: u.name, id: u.freId() })));
        units.set(unitsInModel);
    }

    /**
     * Attempts to create a new unit name from a file name.
     * @param fileName
     */
    private makeUnitNameFromFileName(fileName: string): string {
        const nameExist: boolean = !!this.currentModel.getUnits().find((existing: FreModelUnit) => existing.name === fileName);
        if (nameExist) {
            setUserMessage(`Unit named '${fileName}' already exists, adding number.`, FreErrorSeverity.Error);
            // find the existing names that start with the file name
            const unitsWithSimiliarName = this.currentModel.getUnits().filter((existing: FreModelUnit) => existing.name.startsWith(fileName));
            if (unitsWithSimiliarName.length > 1) {
                // there are already numbered units
                // find the biggest number that is in use after the filename, e.g. Home12, Home3 => 12
                let biggestNr: number = 1;
                // find the characters in each of the existing names that come after the file name
                const trailingParts: string[] = unitsWithSimiliarName.map((existing: FreModelUnit) => existing.name.slice(fileName.length));
                trailingParts.forEach((trailing) => {
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
    showModelUnit(unit: FreModelUnit) {
        LOGGER.log("ModelHandler.showUnitAndErrors called, unitName: " + unit?.name);
        if (!!unit) {
            noUnitAvailable.set(false);
            runInAction(() => {
                this.langEnv.editor.rootElement = unit;
            });
            this.setCurrentUnit(unit);

            WebappConfigurator.getInstance().editorEnvironment.editor.setErrors([]);
        } else {
            noUnitAvailable.set(true);
            runInAction(() => {
                this.langEnv.editor.rootElement = {} as FreNode;
            });
            this.setCurrentUnit(undefined);
            WebappConfigurator.getInstance().editorEnvironment.editor.setErrors([]);
        }
    }

    /**
     * When an error in the errorlist is selected, or a search result is selected, the editor jumps to the faulty element.
     * @param item
     */
    selectElement(item: FreNode, propertyName?: string) {
        //LOGGER.log("Item selected");
        this.langEnv.editor.selectElement(item, propertyName);
    }

    /**
     * Runs the validator for the current unit
     */
    runValidator(): FreError[] {
        const currentUnit = this.getCurrentUnit();
        let list: FreError[] = [];
        if (!!currentUnit) {
            LOGGER.log("EditorState.runValidator - for " + currentUnit.name);
            try {
                list = this.langEnv.validator.validate(currentUnit);
                WebappConfigurator.getInstance().editorEnvironment.editor.setErrors(list);
                modelErrors.set(list);
            } catch (e: unknown) {
                // catch any errors regarding erroneously stored model units
                if (e instanceof Error) {
                    console.log(e.message + e.stack);
                    modelErrors.set([
                        new FreError(
                            "EditorState.runValidator - problem validating model unit: '" + e.message + "'",
                            currentUnit,
                            currentUnit.name,
                            FreErrorSeverity.Error,
                        ),
                    ]);
                }
            }
        } else {
            LOGGER.log("EditorState.runValidator - No current unit to validate");
        }
        return list;
    }

    deleteElement(tobeDeleted: FreNode) {
        if (!!tobeDeleted) {
            // find the owner of the element to be deleted and remove the element there
            const owner = tobeDeleted.freOwner();
            if (owner) {
                const desc: FreOwnerDescriptor = tobeDeleted.freOwnerDescriptor();
                if (!!desc) {
                    if (desc.propertyIndex !== null && desc.propertyIndex !== undefined && desc.propertyIndex >= 0) {
                        const propList = owner[desc.propertyName as keyof typeof owner];
                        if (Array.isArray(propList) && propList.length > desc.propertyIndex) {
                            runInAction(() => propList.splice(desc.propertyIndex!, 1));
                        }
                    } else {
                        console.error("deleting of " + tobeDeleted.freId() + " not succeeded, because owner descriptor is empty.");
                    }
                } else {
                    console.error("deleting of " + tobeDeleted.freId() + " not succeeded, because owner descriptor is empty.");
                }
            } else {
                console.error("deleting of " + tobeDeleted.freId() + " not succeeded, because owner descriptor is empty.");
            }
        }
    }

    pasteInElement(element: FreNode, propertyName: string, index?: number) {
        const property = element[propertyName as keyof typeof element];
        // todo make new copy to keep in 'this.langEnv.editor.copiedElement'
        if (Array.isArray(property)) {
            // console.log('List before: [' + property.map(x => x.freId()).join(', ') + ']');
            runInAction(() => {
                if (index !== null && index !== undefined && index > 0) {
                    property.splice(index, 0, this.langEnv.editor.copiedElement);
                } else {
                    property.push(this.langEnv.editor.copiedElement);
                }
            });
            // console.log('List after: [' + property.map(x => x.freId()).join(', ') + ']');
        } else {
            console.log("property " + propertyName + " is no list");
            // runInAction(() => (element[propertyName] = this.langEnv.editor.copiedElement));
        }
    }
}
