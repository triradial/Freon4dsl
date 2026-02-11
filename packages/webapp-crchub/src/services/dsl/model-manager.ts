// This file contains all methods to connect the webapp to the Freon generated language editorEnvironment and to the server that stores the models
import type { FreEnvironment, FreModel, FreModelUnit, FreNode, FreOwnerDescriptor, InMemoryError, IServerCommunication } from "@freon4dsl/core";
import { BoxFactory, FreError, FreErrorSeverity, FreLogger, FreUndoManager, InMemoryModel } from "@freon4dsl/core";
import { Day, Event, EventSchedule, Period, StudyConfiguration, Task } from "@freon4dsl/study-configuration";
import { runInAction } from "mobx";
import { editorProgressShown, setCurrentModelName, setCurrentUnitName, unitNames, units, updateEditorState, updateModelState, updateUnitLists } from "./model-store.js";
import { schemaMismatchTracker } from "./schema-mismatch-tracker.js";
import { setUserMessage } from "./usermessage-store.js";
import { WebappConfigurator } from "./webapp-configurator.js";
import { perfLogger } from "../performance-logger.js";
import { env } from "../../config/env.js";

const LOGGER = new FreLogger("EditorState").mute();

export class ModelManager {
    private static instance: ModelManager | null = null;
    private modelStore: InMemoryModel;
    private currentUnit: FreModelUnit | undefined;
    private modelErrors: {list: FreError[]} = {list: []};
    private langEnv: FreEnvironment = WebappConfigurator.getInstance().editorEnvironment;
    private serverCommunication: IServerCommunication = WebappConfigurator.getInstance().serverCommunication;
    // Track in-progress openModel operations to avoid race conditions
    private openModelPromises: Map<string, Promise<FreModel | InMemoryError>> = new Map();

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
        updateUnitLists(store.getUnitIdentifiers(), store.getUnits());
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


    //TODO: Graham to review this workaround to avoid race conditions when multiple calls try to open the same model.
    /**
     * Wrapper around modelStore.openModel that tracks in-progress operations
     * to avoid race conditions when multiple calls try to open the same model.
     * If the model is already being opened, this will return the existing promise.
     */
    private async openModelWithTracking(modelName: string): Promise<FreModel | InMemoryError> {
        // Check if there's already an openModel in progress for this model
        const existingPromise = this.openModelPromises.get(modelName);
        if (existingPromise) {
            LOGGER.log(`openModel already in progress for "${modelName}", reusing existing promise`);
            return existingPromise;
        }

        // Start opening the model and track the promise
        const openModelPromise = this.modelStore.openModel(modelName);
        this.openModelPromises.set(modelName, openModelPromise);
        
        try {
            const result = await openModelPromise;
            return result;
        } finally {
            // Remove the promise once it completes (success or failure)
            this.openModelPromises.delete(modelName);
        }
    }

    async createModel(modelName: string) {
        try {
            LOGGER.log("ModelHandler.createModel name: " + modelName);
            this.resetGlobalVariables();
            await this.modelStore.createModel(modelName);
            await this.createStudyConfigurationModelUnits();
        } catch (error) {
            LOGGER.error("Error in newModel: " + error);
        }
    }

    async openModel(modelName: string) {
        LOGGER.log("ModelManager.openModel(" + modelName + ")");
        updateEditorState(true, true, false);
        this.resetGlobalVariables();
        //await this.saveCurrentUnit();
        await this.openModelWithTracking(modelName);
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
        await this.modelStore.deleteModel(modelName);
    }
    
    async createModelUnit(unitName: string, unitType: string) {
        LOGGER.log("model-manager.createModelUnit: unitType: " + unitType + ", name: " + unitName);
        await this.saveCurrentUnit();
        await this.createBasicModelUnit(unitName, unitType);
    }  
    
    async createBasicModelUnit(unitName: string, unitType: string) {
        LOGGER.log("model-manager.createBasicModelUnit called, unitType: " + unitType + " name: " + unitName);
        const newUnit = await this.modelStore.createUnit(unitName, unitType);
        if (!!newUnit) {
            this.showModelUnit(newUnit);
        } else {
            setUserMessage(`Model unit of type '${unitType}' could not be created.`);
        }
    }

    async createRawModelUnit(unitName: string, unitType: string) {
        LOGGER.log("model-manager.createRawModelUnit called, unitType: " + unitType + " name: " + unitName);
        const newUnit = await this.modelStore.createUnit(unitName, unitType);
        if (!!newUnit) {
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

    /**
     * Get a model unit from a model without opening it in the editor UI.
     * This method loads the model into memory but does NOT:
     * - Set it as the current unit
     * - Show it in the editor UI
     * - Reset global variables
     * - Clear caches
     * 
     * Note: This will replace the current model in modelStore if a different model is requested.
     * If you need to preserve the current model, check if it's already open first.
     * 
     * @param modelName - The name of the model to open
     * @param unitName - The name of the unit to retrieve
     * @returns The requested model unit, or undefined if not found
     */
    async getModelUnitWithoutOpening(modelName: string, unitName: string): Promise<FreModelUnit | undefined> {
        LOGGER.log("ModelManager.getModelUnitWithoutOpening modelName: " + modelName + " unitName: " + unitName);
        
        // If the model is already open, check if openModel is still in progress
        if (this.currentModel?.name === modelName) {
            LOGGER.log("Model already open, checking if openModel is in progress...");
            
            // Wait for openModel to complete if it's still loading units
            // We check the map directly to avoid starting a new openModel if none is in progress
            const openModelPromise = this.openModelPromises.get(modelName);
            if (openModelPromise) {
                LOGGER.log(`openModel is still in progress for "${modelName}", waiting for it to complete...`);
                await openModelPromise;
            }
            
            // Now get the unit (should be loaded by now)
            const unit = this.modelStore.getUnitByName(unitName);
            if (unit) {
                LOGGER.log(`ModelManager.getModelUnitWithoutOpening: found unit "${unitName}" (type: ${unit.freLanguageConcept()}, id: ${unit.freId()})`);
                return unit;
            } else {
                LOGGER.error("Unit not found in model: " + unitName);
                return undefined;
            }
        }
        
        // Save current state to restore later
        const previousCurrentUnit = this.currentUnit;
        const previousRootElement = this.langEnv.editor.rootElement;
        const previousModelName = this.currentModel?.name;
        
        try {
            // Open the model in the modelStore (loads from server into memory)
            // This will replace the current model, but we'll restore it after
            await this.openModelWithTracking(modelName);
            
            // Get the unit by name
            const unit = this.modelStore.getUnitByName(unitName);
            if (unit) {
                LOGGER.log(`ModelManager.getModelUnitWithoutOpening: found unit "${unitName}" (type: ${unit.freLanguageConcept()}, id: ${unit.freId()})`);
            } else {
                LOGGER.error(`ModelManager.getModelUnitWithoutOpening: unit "${unitName}" not found in model "${modelName}"`);
            }
            
            // Restore previous model if it was different
            if (previousModelName && previousModelName !== modelName) {
                await this.openModelWithTracking(previousModelName);
            }
            
            // Restore previous editor state
            if (previousCurrentUnit) {
                this.setCurrentUnit(previousCurrentUnit);
                runInAction(() => {
                    this.langEnv.editor.rootElement = previousRootElement;
                });
            }
            
            return unit;
        } catch (error) {
            LOGGER.error("Error in getModelUnitWithoutOpening: " + error);
            // Try to restore state even on error
            if (previousModelName) {
                try {
                    await this.openModelWithTracking(previousModelName);
                    if (previousCurrentUnit) {
                        this.setCurrentUnit(previousCurrentUnit);
                        runInAction(() => {
                            this.langEnv.editor.rootElement = previousRootElement;
                        });
                    }
                } catch (restoreError) {
                    LOGGER.error("Error restoring previous model state: " + restoreError);
                }
            }
            return undefined;
        }
    }

    async openModelUnit(modelName: string, unitName: string): Promise<FreModelUnit | undefined> {
        console.log(`[ModelManager] openModelUnit: modelName=${modelName}, unitName=${unitName}`);
        LOGGER.log("ModelHandler.openModelUnit modelName: " + modelName + " unitName: " + unitName);
        updateEditorState(true, true, false);
        this.resetGlobalVariables();
        // await this.saveCurrentUnit();
        
        // Start capturing schema mismatches during model loading
        schemaMismatchTracker.startCapturing(modelName, unitName);
        
        console.log(`[ModelManager] Calling modelStore.openModel(${modelName})`);
        const openModelResult = await this.openModelWithTracking(modelName);
        console.log(`[ModelManager] modelStore.openModel returned:`, {
            resultType: typeof openModelResult,
            isError: openModelResult?.constructor?.name === 'InMemoryError',
            modelUnitsCount: openModelResult?.constructor?.name === 'InMemoryError' ? 0 : (openModelResult as any)?.units?.length || 0
        });
        
        // Check if another component switched the model while we were loading
        // This can happen when StudyPatients or other components load a different model concurrently
        if (this.modelStore.model?.name !== modelName) {
            console.warn(`[ModelManager] ⚠️ Model was switched during load! Expected: ${modelName}, Current: ${this.modelStore.model?.name}`);
            console.log(`[ModelManager] Re-opening model ${modelName} to restore context...`);
            await this.openModelWithTracking(modelName);
            console.log(`[ModelManager] Model re-opened, current model is now: ${this.modelStore.model?.name}`);
        }
        
        // Stop capturing but DON'T show popup yet - we need to finish setting up the editor first
        const loadReport = schemaMismatchTracker.stopCapturing(false); // pass false to not show popup yet
        
        console.log(`[ModelManager] Getting unit by name: ${unitName}`);
        const unit = this.modelStore.getUnitByName(unitName);
        console.log(`[ModelManager] getUnitByName returned:`, {
            found: !!unit,
            unitType: unit ? typeof unit : 'not found',
            unitName: unit ? (unit as any).name : 'N/A'
        });
        
        if (unit) {
            console.log(`[ModelManager] ✅ Unit found, setting up editor for ${unitName}`);
            this.setCurrentUnit(unit);
            BoxFactory.clearCaches();
            this.langEnv.projectionHandler.clear();
            this.showModelUnit(unit);
            
            // NOW that the editor is set up, handle any schema mismatches
            if (loadReport.mismatches.length > 0) {
                console.log(`[ModelManager] 📋 Schema mismatches detected during load:`, loadReport.mismatches.length);
                // Mark the unit as dirty so it will be saved when user dismisses the popup
                this.modelStore.dirtyUnits.add(unit);
                // Now show the popup
                schemaMismatchTracker.showReport(loadReport);
            }
        } else {
            console.warn(`[ModelManager] ⚠️ Unit NOT found for ${unitName} in model ${modelName}`);
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
        await this.openModelWithTracking(modelName);
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
        perfLogger.start('model-manager-save-unit', { unitName: unit.name });
        
        console.log('💾 ModelManager: saveModelUnit called', {
            unitName: unit.name,
            unitType: unit.freLanguageConcept?.(),
            hasEvents: (unit as any).events?.length >= 0,
            eventsCount: (unit as any).events?.length || 0
        });
        
        // Debug EventSchedule properties if this is a StudyConfiguration
        if (unit.freLanguageConcept?.() === 'StudyConfiguration' && (unit as any).periods) {
            (unit as any).periods.forEach((period: any, periodIdx: number) => {
                if (period.events) {
                    period.events.forEach((event: any, eventIdx: number) => {
                        if (event.eventSchedule) {
                            const schedule = event.eventSchedule;
                            console.log(`💾 ModelManager: EventSchedule at periods[${periodIdx}].events[${eventIdx}]`, {
                                eventStart: schedule.eventStart?.freLanguageConcept?.(),
                                eventWindow: schedule.eventWindow?.freLanguageConcept?.(),
                                complianceWindow: schedule.complianceWindow?.freLanguageConcept?.(),
                                eventTimeOfDay: schedule.eventTimeOfDay?.freLanguageConcept?.(),
                                eventRepeat: schedule.eventRepeat?.freLanguageConcept?.(),
                                eventStartValue: schedule.eventStart || null,
                                eventWindowValue: schedule.eventWindow || null,
                                complianceWindowValue: schedule.complianceWindow || null,
                                eventTimeOfDayValue: schedule.eventTimeOfDay || null,
                                eventRepeatValue: schedule.eventRepeat || null
                            });
                        }
                    });
                }
            });
        }
        
        // Check if unit is in dirtyUnits before calling save
        const isInDirtyUnits = this.modelStore.dirtyUnits.has(unit);
        const dirtyUnitNames = Array.from(this.modelStore.dirtyUnits).map(u => u.name);
        console.log('💾 ModelManager: saveModelUnit - about to call modelStore.saveUnit', {
            unitName: unit.name,
            unitId: unit.freId(),
            isInDirtyUnits,
            dirtyUnitsSize: this.modelStore.dirtyUnits.size,
            dirtyUnitNames
        });
        
        // If unit is NOT in dirty units, add it to ensure save happens
        if (!isInDirtyUnits) {
            console.log('💾 ModelManager: saveModelUnit - unit NOT in dirtyUnits, adding it now');
            this.modelStore.dirtyUnits.add(unit);
        }
        
        perfLogger.start('model-store-save-unit');
        const result = await this.modelStore.saveUnit(unit);
        perfLogger.end('model-store-save-unit');
        
        const isError = result !== undefined && result !== null;
        console.log('💾 ModelManager: saveModelUnit completed', {
            result: isError ? (result as any).message || 'error' : 'success',
            isError
        });
        
        perfLogger.end('model-manager-save-unit', { success: !isError });
    }

    async saveCurrentUnit() {
        console.log('💾 ModelManager: saveCurrentUnit called');
        const unit: FreModelUnit = this.langEnv.editor.rootElement as FreModelUnit;
        if (!!unit) {
            if (!!this.currentModel?.name && this.currentModel?.name?.length) {
                if (!!unit.name && unit.name.length > 0) {
                    console.log('💾 ModelManager: saveCurrentUnit - calling saveModelUnit', {
                        unitName: unit.name,
                        modelName: this.currentModel.name
                    });
                    await this.saveModelUnit(unit);
                    setCurrentUnitName(unit.name);
                    console.log('💾 ModelManager: saveCurrentUnit completed');
                } else {
                    console.warn('💾 ModelManager: saveCurrentUnit - unit has no name');
                    setUserMessage(`Unit without name cannot be saved. Please, name it and try again.`);
                }
            } else {
                console.warn('💾 ModelManager: saveCurrentUnit - no current model');
                LOGGER.log("Internal error: cannot save unit because current model is unknown.");
            }
        } else {
            console.warn('💾 ModelManager: saveCurrentUnit - no current unit');
            LOGGER.log("No current model unit");
        }
    }

    /**
     * Force save the current unit, even if it's not marked as dirty.
     * This is used after loading models with schema mismatches to persist
     * the cleaned data (without the obsolete properties).
     */
    async forceSaveCurrentUnit() {
        console.log('💾 ModelManager: forceSaveCurrentUnit called');
        const unit: FreModelUnit = this.langEnv.editor.rootElement as FreModelUnit;
        if (!!unit) {
            if (!!this.currentModel?.name && this.currentModel?.name?.length) {
                if (!!unit.name && unit.name.length > 0) {
                    console.log('💾 ModelManager: forceSaveCurrentUnit - marking unit as dirty and saving', {
                        unitName: unit.name,
                        modelName: this.currentModel.name
                    });
                    // Mark the unit as dirty so saveUnit will actually save it
                    this.modelStore.dirtyUnits.add(unit);
                    await this.saveModelUnit(unit);
                    setCurrentUnitName(unit.name);
                    console.log('💾 ModelManager: forceSaveCurrentUnit completed');
                } else {
                    console.warn('💾 ModelManager: forceSaveCurrentUnit - unit has no name');
                    setUserMessage(`Unit without name cannot be saved. Please, name it and try again.`);
                }
            } else {
                console.warn('💾 ModelManager: forceSaveCurrentUnit - no current model');
                LOGGER.log("Internal error: cannot save unit because current model is unknown.");
            }
        } else {
            console.warn('💾 ModelManager: forceSaveCurrentUnit - no current unit');
            LOGGER.log("No current model unit");
        }
    }

    /**
     * Save directly to server, bypassing the InMemoryModel dirty check.
     * This is a fallback for when the dirty check fails due to object reference issues.
     */
    async directServerSave(unit: FreModelUnit): Promise<void> {
        console.log('💾 ModelManager: directServerSave called', {
            unitName: unit.name,
            modelName: this.currentModel?.name
        });
        
        if (!this.currentModel?.name) {
            console.error('💾 ModelManager: directServerSave - no current model');
            return;
        }
        
        try {
            // Try direct fetch to bypass any potential issues with ServerCommunication
            const serverUrl = env.serverUrl;
            const url = `${serverUrl}/saveModelUnit?model=${encodeURIComponent(this.currentModel.name)}&unit=${encodeURIComponent(unit.name)}`;
            
            // Serialize the unit using the Freon serializer
            const { FreLionwebSerializer, collectUsedLanguages } = await import('@freon4dsl/core');
            const serializer = new FreLionwebSerializer();
            const nodes = serializer.convertToJSON(unit);
            const body = {
                serializationFormatVersion: "2023.1",
                languages: collectUsedLanguages(nodes),
                nodes: nodes
            };
            
            console.log('💾 ModelManager: directServerSave - sending request to:', url);
            console.log('💾 ModelManager: directServerSave - body size:', JSON.stringify(body).length, 'bytes');
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
            
            console.log('💾 ModelManager: directServerSave - response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('💾 ModelManager: directServerSave - server error:', errorText);
            } else {
                const responseData = await response.json();
                console.log('💾 ModelManager: directServerSave - success, response:', responseData);
            }
        } catch (e) {
            console.error('💾 ModelManager: directServerSave - exception:', e);
        }
    }

    private async createStudyConfigurationModelUnits() {
        try {
            LOGGER.info("ModelHandler.createModelUnits START name: StudyConfiguration");

            await this.createModelUnit("Availability", "Availability");
            await this.saveCurrentUnit();

            await this.createModelUnit("PatientInfo", "PatientInfo");
            await this.saveCurrentUnit();

            await this.createModelUnit("StudyConfiguration", "StudyConfiguration");
            const studyConfigUnit: StudyConfiguration = this.modelStore.getUnitByName("StudyConfiguration") as StudyConfiguration;
            studyConfigUnit.periods.push(Period.create(Period.create({ name: "Screening" })));
            const screeningEvent = Event.create({ name: "Screen" });
            screeningEvent.schedule = EventSchedule.create({ eventStart: Day.create({ startDay: 0 })});
            studyConfigUnit.periods[0].events.push(screeningEvent);
            studyConfigUnit.periods[0].events[0].tasks.push(Task.create({ name: "Task 1" }));
            await this.saveCurrentUnit();

            this.setCurrentUnit(studyConfigUnit);
            setCurrentModelName(this.currentModel.name);

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
        unitNames.set(unitsInModel.map((u) => ({ name: u.name, id: u.freId() })));
        units.set(unitsInModel);
    }

    selectElement(item: FreNode, propertyName?: string) {
        if (!this.langEnv?.editor) {
            return;
        }
        
        // Get the box for the node from projection (before selection may walk up to parent)
        const projection = (this.langEnv.editor as any).projection;
        const existingBox = projection?.getBox?.(item);
        
        // Select the element in the editor
        this.langEnv.editor.selectElement(item, propertyName);
        
        // Get the selected box (may be different from existingBox if findBoxForNode walked up)
        const selectedBox = (this.langEnv.editor as any)._selectedBox;
        
        // Scroll the element into view after selection
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
            this.scrollSelectedElementIntoView(item, existingBox, selectedBox);
        });
    }
    
    /**
     * Scroll the selected element into view.
     * Tries multiple strategies to find the DOM element:
     * 1. Use the target node's box ID (most specific)
     * 2. Search by node ID pattern in any attribute
     * 3. Use the selected box ID (fallback if findBoxForNode walked up)
     */
    private scrollSelectedElementIntoView(targetNode: FreNode, existingBox: any, selectedBox: any): void {
        const nodeId = targetNode?.freId?.();
        
        // Strategy 1: Try to find element by the existing box ID (the actual target)
        if (existingBox?.id) {
            const targetComponentId = `${nodeId}-${existingBox.role}`;
            let element = document.getElementById(targetComponentId);
            if (!element) {
                element = document.getElementById(`render-${targetComponentId}`);
            }
            if (element) {
                this.scrollElementIntoViewWithinContainer(element);
                return;
            }
        }
        
        // Strategy 2: Search for any element with ID containing the node ID
        if (nodeId) {
            let element = document.querySelector(`[id^="${nodeId}-"]`) as HTMLElement;
            if (!element) {
                element = document.querySelector(`[id^="render-${nodeId}-"]`) as HTMLElement;
            }
            if (!element) {
                element = document.querySelector(`[id*="${nodeId}"]`) as HTMLElement;
            }
            if (element) {
                this.scrollElementIntoViewWithinContainer(element);
                return;
            }
        }
        
        // Strategy 3: Try to find element by the selected box ID (fallback - scrolls to parent)
        if (selectedBox?.id) {
            const selectedComponentId = `${selectedBox.node?.freId?.()}-${selectedBox.role}`;
            let element = document.getElementById(selectedComponentId);
            if (!element) {
                element = document.getElementById(`render-${selectedComponentId}`);
            }
            if (element) {
                this.scrollElementIntoViewWithinContainer(element);
                return;
            }
        }
    }
    
    /**
     * Scroll an element into view, handling nested scrollable containers.
     * First scrolls within any scrollable parent container, then scrolls the viewport.
     */
    private scrollElementIntoViewWithinContainer(element: HTMLElement): void {
        const scrollableContainer = this.findScrollableParent(element);
        
        if (scrollableContainer && scrollableContainer !== document.documentElement && scrollableContainer !== document.body) {
            // Calculate the element's position relative to the scrollable container
            const containerRect = scrollableContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            // Calculate scroll position to center the element in the container
            const scrollTop = scrollableContainer.scrollTop + (elementRect.top - containerRect.top) - (containerRect.height / 2) + (elementRect.height / 2);
            
            scrollableContainer.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        } else {
            // Fallback to standard scrollIntoView
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * Find the first scrollable parent element.
     */
    private findScrollableParent(element: HTMLElement): HTMLElement | null {
        let parent = element.parentElement;
        
        while (parent) {
            const style = window.getComputedStyle(parent);
            const overflowY = style.overflowY;
            const overflowX = style.overflowX;
            
            if ((overflowY === 'auto' || overflowY === 'scroll' || overflowX === 'auto' || overflowX === 'scroll') &&
                (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth)) {
                return parent;
            }
            
            parent = parent.parentElement;
        }
        
        return document.documentElement;
    }

    runValidator(): FreError[] {
        perfLogger.start('model-manager-run-validator');
        
        const currentUnit = this.getCurrentUnit();
        let list: FreError[] = [];
        if (!!currentUnit) {
            LOGGER.log("EditorState.runValidator - for " + currentUnit.name);
            try {
                perfLogger.start('validator-validate');
                list = this.langEnv.validator.validate(currentUnit);
                perfLogger.end('validator-validate', { errorCount: list.length });
                
                perfLogger.start('set-editor-errors');
                WebappConfigurator.getInstance().editorEnvironment.editor.setErrors(list);
                perfLogger.end('set-editor-errors');
                
                this.modelErrors = {list: list};
            } catch (e: unknown) {
                if (e instanceof Error) {
                    console.log(e.message + e.stack);
                    perfLogger.mark('validator-error', { error: e.message });
                    this.modelErrors = {list: [
                        new FreError("EditorState.runValidator - problem validating model unit: '" + e.message + "'", currentUnit, currentUnit.name, FreErrorSeverity.Error),
                    ]};
                }
            }
        } else {
            LOGGER.log("EditorState.runValidator - No current unit to validate");
        }
        
        perfLogger.end('model-manager-run-validator', { errorCount: list.length });
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
