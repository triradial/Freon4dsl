import { Sim, Simulator, StudyChecklistDocumentTemplate, StudyConfiguration, TimelineChartTemplate, TimelineTableTemplate } from "@freon4dsl/study-configuration";
import { ModelManager } from "../dsl/model-manager.js";

interface SimulationCache {
    timeline: any;
    tableHtml: string;
    chartHtml: string;
    checklistMarkdown: string;
    lastUpdated: number;
}

class SimulationService {
    private static instance: SimulationService | null = null;
    private cache: Map<string, SimulationCache> = new Map();
    private runningSimulations: Map<string, Promise<SimulationCache>> = new Map();

    static getInstance(): SimulationService {
        if (!SimulationService.instance) {
            SimulationService.instance = new SimulationService();
        }
        return SimulationService.instance;
    }

    /**
     * Get or generate simulation data for a study
     * Returns cached data if available and in sync, otherwise generates new data
     */
    async getSimulationData(studyId: string, forceRefresh: boolean = false): Promise<SimulationCache | null> {
        const startTime = performance.now();
        console.log(`[SimulationService] getSimulationData for study ${studyId}, forceRefresh=${forceRefresh}`);

        // Check if already running
        if (this.runningSimulations.has(studyId)) {
            console.log(`[SimulationService] Simulation already running for ${studyId}, waiting...`);
            return await this.runningSimulations.get(studyId)!;
        }

        // Check cache first if not forcing refresh

        // During dev always want to force refresh MV 1/30/2026
        forceRefresh = true;

        if (!forceRefresh && this.cache.has(studyId)) {
            const cached = this.cache.get(studyId)!;
            const elapsed = performance.now() - startTime;
            console.log(`[SimulationService] Using cached data for ${studyId} (${elapsed.toFixed(2)}ms)`);
            return cached;
        }

        // TODO: Check database for cached simulation when API endpoints are available
        // For now, we only use in-memory cache

        // Generate new simulation
        const simulationPromise = this.generateSimulation(studyId);
        this.runningSimulations.set(studyId, simulationPromise);

        try {
            const result = await simulationPromise;
            const elapsed = performance.now() - startTime;
            console.log(`[SimulationService] Generated simulation for ${studyId} (${elapsed.toFixed(2)}ms)`);
            return result;
        } finally {
            this.runningSimulations.delete(studyId);
        }
    }

    /**
     * Generate simulation data from study configuration
     */
    private async generateSimulation(studyId: string): Promise<SimulationCache> {
        const genStartTime = performance.now();
        console.log(`[SimulationService] Starting simulation generation for ${studyId}`);

        // Get the configuration unit
        const modelManager = ModelManager.getInstance();
        const unit = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;
        if (!unit) {
            throw new Error("Configuration unit is not available in the model.");
        }

        // Generate Timeline ONCE (this runs the simulator) - this is the expensive operation
        const timelineStartTime = performance.now();
        // Initialize Sim - needed for Sim to be properly loaded in Scheduler class
        new Sim();
        const simulator = new Simulator(unit);
        
        try {
            simulator.run();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const errorStack = err instanceof Error ? err.stack : undefined;
            console.error(`[SimulationService] Error running simulator:`, {
                message: errorMessage,
                studyId
            });
            if (errorStack) {
                console.error('[SimulationService] Stack trace:\n', errorStack);
            }
            // Re-throw with more context (original stack already logged above)
            throw new Error(`Simulation failed: ${errorMessage}. This usually indicates missing or invalid data in the study configuration (e.g., undefined event names, periods, or scheduling properties).`);
        }
        
        const timeline = simulator.timeline;
        const timelineElapsed = performance.now() - timelineStartTime;
        console.log(`[SimulationService] ⚡ Timeline generated in ${timelineElapsed.toFixed(2)}ms (simulator ran once)`);
        
        // Diagnostic logging to help debug empty timeline issues
        const daysCount = timeline.getDays?.()?.length ?? 0;
        if (daysCount === 0) {
            console.warn(`[SimulationService] ⚠️ Timeline has NO days! This indicates the study configuration has no scheduled events.`);
            console.warn(`[SimulationService] Study config details:`, {
                studyId,
                hasTimeline: !!timeline,
                currentDay: timeline.currentDay,
                studyStartDayNumber: timeline.studyStartDayNumber,
                referenceDate: timeline.referenceDate
            });
        } else {
            console.log(`[SimulationService] Timeline has ${daysCount} days`);
        }

        // Generate all three views from the SAME Timeline (no additional simulator runs)
        const tableStartTime = performance.now();
        const tableHTML = TimelineTableTemplate.getTimeLineTableAndStyles(timeline);
        const tableHtml = `<div class="limited-width-container">${tableHTML}</div>`;
        const tableElapsed = performance.now() - tableStartTime;
        console.log(`[SimulationService] Table HTML generated in ${tableElapsed.toFixed(2)}ms (from existing timeline)`);

        const chartStartTime = performance.now();
        const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
        const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
        const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML, false, true);
        const chartHtml = `<div class="limited-width-container">${chartHTML}</div>`;
        const chartElapsed = performance.now() - chartStartTime;
        console.log(`[SimulationService] Chart HTML generated in ${chartElapsed.toFixed(2)}ms (from existing timeline)`);

        const checklistStartTime = performance.now();
        const checklistMarkdown = StudyChecklistDocumentTemplate.getStudyChecklistAsMarkdown(unit, timeline, true);
        const checklistElapsed = performance.now() - checklistStartTime;
        console.log(`[SimulationService] Checklist markdown generated in ${checklistElapsed.toFixed(2)}ms (from existing timeline)`);

        // TODO: Save to database (async, don't wait) when API endpoints are available
        // this.saveSimulationToDatabase(studyId, timeline).catch(err => {
        //     console.warn(`[SimulationService] Failed to save simulation to database:`, err);
        // });

        const cache: SimulationCache = {
            timeline,
            tableHtml,
            chartHtml,
            checklistMarkdown,
            lastUpdated: Date.now()
        };

        this.cache.set(studyId, cache);
        const totalElapsed = performance.now() - genStartTime;
        console.log(`[SimulationService] Complete simulation generated for ${studyId} in ${totalElapsed.toFixed(2)}ms`);

        return cache;
    }

    /**
     * Save simulation to database (async, fire and forget)
     * TODO: Implement when API endpoints are available
     */
    // private async saveSimulationToDatabase(studyId: string, timeline: any): Promise<void> {
    //     try {
    //         // Serialize Timeline to JSON for storage
    //         // Note: Timeline serialization may need custom logic
    //         const serialized = JSON.stringify(timeline);
    //         await saveStudySimulation(studyId, JSON.parse(serialized));
    //         console.log(`[SimulationService] Saved simulation to database for ${studyId}`);
    //     } catch (err) {
    //         console.error(`[SimulationService] Error saving simulation:`, err);
    //     }
    // }

    /**
     * Clear cache for a study (call when model changes)
     */
    clearCache(studyId: string): void {
        this.cache.delete(studyId);
        console.log(`[SimulationService] Cleared cache for ${studyId}`);
    }

    /**
     * Check if cache exists and is valid
     */
    hasValidCache(studyId: string): boolean {
        return this.cache.has(studyId);
    }
}

export const simulationService = SimulationService.getInstance();
