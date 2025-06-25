<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ListPlaceholder } from "flowbite-svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { AST, RtString } from "@freon4dsl/core";
    import { PatientHistory, PatientHistoryUnit, PatientInfo, type StudyConfigurationModel } from "@freon4dsl/samples-study-configuration";
    import { getTimelineChart } from "../../services/app/study-timeline.js";
    import { getTimelineAsOfADate } from "services/app/patient-timeline.js";
    import { fillDateConceptFromAsString, Timeline } from "@freon4dsl/samples-study-configuration/dist/custom/timeline/Timeline.js";
    import { dataStore, type Patient } from "../../services/data/data-store.js";

    export let id: string;
    let isLoading = true;
    let showChart = false;
    let chartHtml: string = "";
    let error: string | null = null;
    let container: HTMLElement | null = null;
    let patientInfo: PatientInfo | undefined;

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        loadChart(id);
    }

    $: {
        if (!id) {
            console.error(`Patient with id ${id} not found`);
        } else {
            loadChart(id);
        }

    }

    const getTimelineChartError = () => {
        const html = `<div class="limited-width-container"><div class='text-red-500'>Error: PatientInfo not found</div></div>`;
        return new RtString(html);
    };

    const fillDateConcept = (dateConcept: any) => {
        fillDateConceptFromAsString(dateConcept);
    };

    const getChartWithPatientHistory = async (referenceDate: Date) => {
        const modelManager = ModelManager.getInstance();
        const fetchedPatient = await dataStore.getPatient(id);

        let found = false;
        let patientHistory: PatientHistory = PatientHistory.create({});
        // Get the model data for all the Patients
        patientInfo = await modelManager.openModelUnitWithoutSavingCurrentUnit(fetchedPatient!.studyId, "PatientInfo") as PatientInfo;
        if (!patientInfo || patientInfo === undefined) {
            const rtObject = getTimelineChartError() as RtString;
            return rtObject.asString();
        }
              
        patientInfo!.patientHistories.forEach(aPatientHistory => {
            if (!found && aPatientHistory.patient_id === fetchedPatient!.patientNumber) {               
                aPatientHistory.patientVisits.forEach(visit => {
                    let updatedVisit = visit.copy(); 
                    fillDateConcept(updatedVisit.actualVisitDate);  // Use the action wrapper
                    patientHistory.patientVisits.push(updatedVisit);
                });
                aPatientHistory.patientNotAvailableDates.dates.forEach(dateRange => {
                    let updatedDateRange = dateRange.copy();
                    fillDateConcept(updatedDateRange.startDate);  // Use the action wrapper
                    if (updatedDateRange.endDate) {
                        fillDateConcept(updatedDateRange.endDate);  // Use the action wrapper
                    }
                    patientHistory.patientNotAvailableDates.dates.push(updatedDateRange);
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
                referenceDateForTimeline = new Date(2024, 8, 30);
            }
        }

        const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
        const studyConfig = model.configuration;
        studyConfig.studyStartDayNumber = 0;
        
        let timeline = getTimelineAsOfADate(studyConfig, referenceDateForTimeline, patientHistory);
        const rtObject = (timeline as Timeline).getTimelineChartHtml() as RtString;
        return rtObject.asString();
    };

    async function loadChart(id: string) {
        isLoading = true;
        showChart = false;
        error = null;
        try {
            const startTime = Date.now();
            const referenceDate = new Date(2024, 8, 30);
            chartHtml = await getChartWithPatientHistory(referenceDate);
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
    
    {#if error}
        <div class="text-red-500 p-4">{error}</div>
    {/if}
</div>
