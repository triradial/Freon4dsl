<script lang="ts">
    import { AST, RtString } from "@freon4dsl/core";
    import { PatientHistory, PatientInfo, Timeline, type StudyConfiguration } from "@freon4dsl/study-configuration";
    import { createEventDispatcher } from "svelte";
    import { getTimelineAsOfADate } from "../../services/app/patient-timeline.js";
    import { dataStore } from "../../services/data/data-store.js";
    import { ModelManager } from "../../services/dsl/model-manager.js";

    let { id, studyId } = $props<{ id: string; studyId: string }>();

    let isLoading = $state(true);
    let showChart = $state(false);
    let chartHtml = $state<string>("");
    let error = $state<string | null>(null);
    let container = $state<HTMLElement | null>(null);
    let patientInfo: PatientInfo | undefined;

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        loadChart(id);
    }

    $effect(() => {
        if (!id) {
            console.error(`Patient with id ${id} not found`);
        } else {
            loadChart(id);
        }
    });

    const getTimelineChartError = () => {
        const html = `<div class="limited-width-container"><div class='text-red-500'>Error: PatientInfo not found</div></div>`;
        return new RtString(html);
    };

    const fillDateConcept = (dateConcept: any) => {
        Timeline.fillDateConceptFromAsString(dateConcept);
    };

    const getChartWithPatientHistory = async (referenceDate: Date) => {
        const modelManager = ModelManager.getInstance();
        const fetchedPatient = await dataStore.getPatient(id);

        let found = false;
        // Create a new PatientHistory that is completely isolated from the model to avoid editor observation
        let patientHistory: PatientHistory = PatientHistory.create({});
        // Get the model data for all the Patients (without opening in editor to avoid redraw loops)
        patientInfo = await modelManager.getModelUnitWithoutOpening(fetchedPatient!.studyId, "PatientInfo") as PatientInfo;
        if (!patientInfo || patientInfo === undefined) {
            const rtObject = getTimelineChartError() as RtString;
            return rtObject.asString();
        }
        
        console.log("PatientInfo found:", patientInfo);
        console.log("Looking for patient with ID:", fetchedPatient!.patientNumber);
        console.log("Available patient histories:", patientInfo!.patientHistories.length);
        
        patientInfo!.patientHistories.forEach(aPatientHistory => {
            console.log("Checking patient history:", aPatientHistory.patient_id);
            if (!found && aPatientHistory.patient_id === fetchedPatient!.patientNumber) {
                console.log("Found matching patient history!");

                console.log("Patient visits:", aPatientHistory.patientVisits.length);
                aPatientHistory.patientVisits.forEach((visit, index) => {
                    console.log(`  patientVisits[${index}]:`, {
                        name: visit.name,
                        visitInstanceNumber: visit.visitInstanceNumber,
                        actualVisitDate: visit.actualVisitDate?.dateAsString,
                        status: visit.status,
                        visit: visit
                    });
                });
                
                console.log("Not available dates:", aPatientHistory.patientNotAvailableDates.length);               
                aPatientHistory.patientNotAvailableDates.forEach((dateRange, index) => {
                    console.log(`  patientNotAvailableDates[${index}]:`, {
                        startDate: dateRange.startDate?.dateAsString,
                        endDate: dateRange.endDate?.dateAsString,
                        dateRange: dateRange
                    });
                });
                
                // Copy visits and date ranges, then fill date concepts
                // All modifications must be within AST.change() to satisfy MobX strict mode
                AST.change(() => {
                    // Process visits - copy first, then modify date concepts
                    for (const visit of aPatientHistory.patientVisits) {
                        const updatedVisit = visit.copy();
                        if (updatedVisit.actualVisitDate) {
                            // fillDateConcept modifies MobX observables, so it must be inside AST.change()
                            fillDateConcept(updatedVisit.actualVisitDate);
                        }
                        patientHistory.patientVisits.push(updatedVisit);
                    }
                    // Process date ranges - copy first, then modify date concepts
                    for (const dateRange of aPatientHistory.patientNotAvailableDates) {
                        const updatedDateRange = dateRange.copy();
                        if (updatedDateRange.startDate) {
                            fillDateConcept(updatedDateRange.startDate);
                        }
                        if (updatedDateRange.endDate) {
                            fillDateConcept(updatedDateRange.endDate);
                        }
                        patientHistory.patientNotAvailableDates.push(updatedDateRange);
                    }
                });
                found = true;
            };
        });
        
        if (!found) {
            console.error("No matching patient history found!");
            const rtObject = getTimelineChartError() as RtString;
            return rtObject.asString();
        }
        
        let referenceDateForTimeline : Date | undefined;
        if (referenceDate === undefined) {
            if (patientHistory.patientVisits.length > 0) {
                referenceDateForTimeline = new Date(patientHistory.patientVisits[0].actualVisitDate.dateAsString);
            } else {
                referenceDateForTimeline = new Date(Date.now());
            }
        } else {
            referenceDateForTimeline = new Date(referenceDate);
        }
        console.log("Reference date for timeline: " + referenceDateForTimeline);

        // // Get the model and configuration unit
        // const studyModelManager = ModelManager.getInstance();
        // await studyModelManager.openModel(studyId);
        // const model = studyModelManager.currentModel as StudyConfigurationModel;
        // const studyConfig = model.configuration;
        // studyConfig.studyStartDayNumber = 0;
        
        // Get the model and configuration unit
        const studyModelManager = ModelManager.getInstance();
        const studyConfig = await studyModelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;
        if (!studyConfig) {
            throw new Error(`StudyConfiguration unit not found for study: ${studyId}`);
        }
        // AST.change(() => {
        //     studyConfig.studyStartDayNumber = 0;
        // });

        console.log("Creating timeline with patient history...");
        let timeline = getTimelineAsOfADate(studyConfig, referenceDateForTimeline, patientHistory);
        console.log("Timeline created, getting chart HTML...");
        const rtObject = (timeline as Timeline).getTimelineChartHtml() as RtString;
        console.log("Chart HTML generated");
        return rtObject.asString();
    };

    async function loadChart(id: string) {
        isLoading = true;
        showChart = false;
        error = null;
        try {
            const startTime = Date.now();
            // const referenceDate = new Date(2024, 8, 30);
            chartHtml = await getChartWithPatientHistory(undefined);
            await new Promise((resolve) => setTimeout(() => resolve(null), 0)); // Allow DOM to update
            await loadChartData();
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 5000) {
                await new Promise((resolve) => setTimeout(resolve, 5000 - elapsedTime));
            }
            showChart = true;
        } catch (err: unknown) {
            console.error(`Error fetching chart data for study: ${id}`, err);
            error = err instanceof Error ? err.message : "An error occurred while fetching chart data";
        } finally {
            isLoading = false;
        }
    }

    function executeScripts() {
        return new Promise<void>((resolve) => {
            if (container) {
                // Wait for vis library to be available
                const waitForVis = () => {
                    if (typeof (window as any).vis !== 'undefined') {
                        const scripts = container!.querySelectorAll("script");
                        scripts.forEach((oldScript) => {
                            const newScript = document.createElement("script");
                            newScript.textContent = oldScript.textContent;
                            oldScript.replaceWith(newScript);
                        });
                        
                        // Wait for next frame to ensure scripts execute
                        requestAnimationFrame(() => {
                            resolve();
                        });
                    } else {
                        // Check again in a short while
                        setTimeout(waitForVis, 50);
                    }
                };
                
                waitForVis();
            } else {
                resolve();
            }
        });
    }

    async function loadChartData() {
        if (container) {
            container.innerHTML = chartHtml;
            await executeScripts(); // Wait for scripts to actually execute
        }
    }
</script>

<svelte:head>
    <script src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"></script>
    <link href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css" rel="stylesheet" type="text/css" />
</svelte:head>
    
{#if error}
    <div class="drawer-error p-4">{error}</div>
{:else}
    <div class="drawer-content-area p-2">
        <div style="display: {isLoading ? 'block' : 'none'}" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-600">Preparing Patient Timeline...</p>
        </div>
        
        <div style="display: {!isLoading && showChart ? 'block' : 'none'}">
            <div bind:this={container}>
                {@html chartHtml}
            </div>
        </div>
    </div>
{/if}