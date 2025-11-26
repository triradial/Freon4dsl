// This file contains all methods to connect the webapp to the Freon generated language editorEnvironment and to the server that stores the models
import type { FreEnvironment, FreModel, FreModelUnit, FreNode, FreOwnerDescriptor, IServerCommunication } from "@freon4dsl/core";
import { BoxFactory, FreError, FreErrorSeverity, FreLogger, FreUndoManager, InMemoryModel, isInMemoryError } from "@freon4dsl/core";
import { runInAction } from "mobx";
import { Description, StudyExtract, Topic } from "@freon4dsl/project-configuration";
import { editorProgressShown, setCurrentModelName, setCurrentUnitName, unitNames, units, updateEditorState, updateModelState, updateUnitLists } from "./model-store.js";
import { setUserMessage } from "./usermessage-store.js";
import { WebappConfigurator } from "./webapp-configurator.js";

const LOGGER = new FreLogger("EditorState").mute();

export class ModelManager {
    private static instance: ModelManager | null = null;
    private modelStore: InMemoryModel;
    private currentUnit: FreModelUnit | undefined;
    private modelErrors: {list: FreError[]} = {list: []};
    private langEnv: FreEnvironment = WebappConfigurator.getInstance().editorEnvironment;
    private serverCommunication: IServerCommunication = WebappConfigurator.getInstance().serverCommunication;

    static getInstance(): ModelManager {
        if (ModelManager.instance === null) {
            ModelManager.instance = new ModelManager();
        }
        return ModelManager.instance;
    }

    private constructor() {
        this.modelStore = new InMemoryModel(this.langEnv, this.serverCommunication);
        this.modelStore.addCurrentModelListener(this.modelChanged);
    }

    modelChanged = (store: InMemoryModel): void => {
        LOGGER.log("modelChanged");
        updateModelState(store?.model?.name || '', '');
        updateUnitLists(
            { ids: store.getUnitIdentifiers(), refs: store.getUnits() },
            { ids: store.getUnitIdentifiers(), refs: store.getUnits() }
        );
    };

    getCurrentUnit(): FreModelUnit | undefined {
        return this.currentUnit;
    }

    setCurrentUnit(unit: FreModelUnit | undefined) {
        this.currentUnit = unit;
        if (unit) {
            FreUndoManager.getInstance().currentUnit = unit;
            setCurrentUnitName(unit.name);
        } else {
            setCurrentUnitName("");
        }
    }

    get currentModel(): FreModel {
        return this.modelStore.model;
    }

    async createModel(modelName: string) {
        try {
            LOGGER.log("ModelHandler.createModel name: " + modelName);
            this.resetGlobalVariables();
            await this.modelStore.createModel(modelName);
            await this.createStudyExtractModelUnits();
        } catch (error) {
            LOGGER.error("Error in newModel: " + error);
        }
    }

    async openModel(modelName: string) {
        LOGGER.log("ModelManager.openModel(" + modelName + ")");
        updateEditorState(true, true, false);
        this.resetGlobalVariables();
        //await this.saveCurrentUnit();
        await this.modelStore.openModel(modelName);
        const unitIdentifiers = this.modelStore.getUnitIdentifiers();
        if (!!unitIdentifiers && unitIdentifiers.length > 0) {
            let first: boolean = true;
            for (const unitIdentifier of unitIdentifiers) {
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
            updateEditorState(false, true, false);
        }
    }
    
    async deleteModel(modelName: string) {
        LOGGER.log("ModelManager.deleteModel(" + modelName + ")");
        this.resetGlobalVariables();
        await this.saveCurrentUnit();
        await this.modelStore.deleteModel();
    }
    
    async createModelUnit(unitName: string, unitType: string) {
        LOGGER.log("model-manager.createModelUnit: unitType: " + unitType + ", name: " + unitName);
        await this.saveCurrentUnit();
        await this.createBasicModelUnit(unitName, unitType);
    }  
    
    async createBasicModelUnit(unitName: string, unitType: string) {
        LOGGER.log("model-manager.createBasicModelUnit called, unitType: " + unitType + " name: " + unitName);
        console.log("model-manager.createBasicModelUnit called, unitType: " + unitType + " name: " + unitName);
        const newUnit = await this.modelStore.createUnit(unitName, unitType);
        if (!isInMemoryError(newUnit)) {
            // Don't set name again - createUnit already sets it, and setting it again might trigger a rename
            // newUnit.name = unitName; // REMOVED: This was causing rename operations that deleted the unit
            console.log("model-manager.createBasicModelUnit: unit created with name: " + newUnit.name);
            this.showModelUnit(newUnit);
        } else {
            setUserMessage(`Model unit of type '${unitType}' could not be created.`);
        }
    }

    async createRawModelUnit(unitName: string, unitType: string) {
        LOGGER.log("model-manager.createRawModelUnit called, unitType: " + unitType + " name: " + unitName);
        const newUnit = await this.modelStore.createUnit(unitName, unitType);
        if (!isInMemoryError(newUnit)) {
            newUnit.name = unitName;
        } else {
            setUserMessage(`Model unit of type '${unitType}' could not be created.`);
        }
    }

    getModelUnit(unitName: string): FreModelUnit | undefined {
        console.log("ModelManager.getModelUnit: " + unitName);
        if (this.modelStore) {
            console.log("ModelManager.getModelUnit: this.modelStore.getUnitByName(unitName): " + this.modelStore.getUnitByName(unitName));
            return this.modelStore.getUnitByName(unitName);
        }
        console.log("ModelManager.getModelUnit: undefined");
        return undefined;
    }

    async openModelUnit(modelName: string, unitName: string): Promise<FreModelUnit | undefined> {
        LOGGER.log("ModelHandler.openModelUnit modelName: " + modelName + " unitName: " + unitName);
        updateEditorState(true, true, false);
        this.resetGlobalVariables();
        // await this.saveCurrentUnit();
        await this.modelStore.openModel(modelName);
        const unit = this.modelStore.getUnitByName(unitName);
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

    async openModelUnitFromFile(fileName: string, content: string, metaType: string, showIt: boolean) {
        await this.saveCurrentUnit();
        let unit: FreModelUnit;
        try {
            unit = this.langEnv.reader.readFromString(content, metaType, this.currentModel, fileName) as FreModelUnit;
            if (!!unit) {
                if (!unit.name || unit.name.length === 0) {
                    unit.name = this.makeUnitNameFromFileName(fileName);
                }
                if (showIt) {
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

    async saveModelUnit(unit: FreModelUnit) {
        await this.modelStore.saveUnit(unit);
    }

    async saveCurrentUnit() {
        console.log("ModelHandler.saveCurrentUnit");
        const unit: FreModelUnit = this.langEnv.editor.rootElement as FreModelUnit;
        if (!!unit) {
            if (!!this.currentModel?.name && this.currentModel?.name?.length) {
                if (!!unit.name && unit.name.length > 0) {
                    await this.modelStore.saveUnit(unit);
                    setCurrentUnitName(unit.name);
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

    private async createStudyExtractModelUnits() {
        try {
            LOGGER.info("ModelHandler.createModelUnits START name: StudyExtract");
            console.log("ModelHandler.createModelUnits START name: StudyExtract");
            this.setCurrentUnit(undefined);
            await this.createModelUnit("StudyExtract", "StudyExtract");
            const studyExtractUnit = this.modelStore.getUnitByName("StudyExtract");
            console.log("studyExtractUnit:", studyExtractUnit);

            this.setCurrentUnit(studyExtractUnit);
            await this.saveCurrentUnit();

            console.log("this.getCurrentUnit():", this.getCurrentUnit());
            setCurrentModelName(this.currentModel.name);

            LOGGER.info("ModelHandler.createModelUnits END name: StudyExtract");

        } catch (error: unknown) {
            if (error instanceof Error) {
                LOGGER.error("ModelHandler.createModelUnits ERROR: " + error.message);
                LOGGER.error("ModelHandler.createModelUnits ERROR: Stack trace: " + error.stack);
            } else {
                LOGGER.error("ModelHandler.createModelUnits ERROR: " + String(error));
            }
        }
    }

    private resetGlobalVariables() {
        updateEditorState(false, true, false);
        updateUnitLists({ids: [], refs: []}, {ids: [], refs: []});
        this.modelErrors = {list: []};
    }

    private showModelUnit(unit: FreModelUnit) {
        LOGGER.log("ModelHandler.showUnitAndErrors called, unitName: " + unit?.name);
        try {
            if (!!unit) {
                updateEditorState(false, false, false);
                runInAction(() => {
                    this.langEnv.editor.rootElement = unit;
                });
                this.setCurrentUnit(unit);
                WebappConfigurator.getInstance().editorEnvironment.editor.setErrors([]);
            } else {
                updateEditorState(false, true, false);
                runInAction(() => {
                    this.langEnv.editor.rootElement = {} as FreNode;
                });
                this.setCurrentUnit(undefined);
                WebappConfigurator.getInstance().editorEnvironment.editor.setErrors([]);
            }
        } catch (e) {
            console.log("Error showing model unit:", unit);
            throw e;
        }   
    }

    private setUnitLists() {
        LOGGER.log("setUnitLists");
        const unitsInModel = this.currentModel.getUnits();
        unitNames.set({ ids: this.modelStore.getUnitIdentifiers(), refs: unitsInModel });
        units.set({ ids: this.modelStore.getUnitIdentifiers(), refs: unitsInModel });
    }

    selectElement(item: FreNode, propertyName?: string) {
        this.langEnv.editor.selectElement(item, propertyName);
    }

    runValidator(): FreError[] {
        const currentUnit = this.getCurrentUnit();
        let list: FreError[] = [];
        if (!!currentUnit) {
            LOGGER.log("EditorState.runValidator - for " + currentUnit.name);
            try {
                list = this.langEnv.validator.validate(currentUnit);
                WebappConfigurator.getInstance().editorEnvironment.editor.setErrors(list);
                this.modelErrors = {list: list};
            } catch (e: unknown) {
                if (e instanceof Error) {
                    console.log(e.message + e.stack);
                    this.modelErrors = {list: [
                        new FreError("EditorState.runValidator - problem validating model unit: '" + e.message + "'", currentUnit, currentUnit.name, FreErrorSeverity.Error),
                    ]};
                }
            }
        } else {
            LOGGER.log("EditorState.runValidator - No current unit to validate");
        }
        return list;
    }

    deleteElement(tobeDeleted: FreNode) {
        if (!!tobeDeleted) {
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
        if (Array.isArray(property)) {
            runInAction(() => {
                if (index !== null && index !== undefined && index > 0) {
                    property.splice(index, 0, this.langEnv.editor.copiedElement);
                } else {
                    property.push(this.langEnv.editor.copiedElement);
                }
            });
        } else {
            console.log('property ' + propertyName + ' is no list');
        }
    }

    private makeUnitNameFromFileName(fileName: string): string {
        const nameExist: boolean = !!this.currentModel.getUnits().find((existing: FreModelUnit) => existing.name === fileName);
        if (nameExist) {
            setUserMessage(`Unit named '${fileName}' already exists, adding number.`, FreErrorSeverity.Error);
            const unitsWithSimiliarName = this.currentModel.getUnits().filter((existing: FreModelUnit) => existing.name.startsWith(fileName));
            if (unitsWithSimiliarName.length > 1) {
                let biggestNr: number = 1;
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
}
