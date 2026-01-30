<script lang="ts">
    import { RtString } from "@freon4dsl/core";
    import { PatientHistory, PatientInfo, copyPatientHistoryWithFilledDates, determineReferenceDate, findFirstPatientHistoryWithVisits, findPatientHistoryByPatientNumber, getTimelineAsOfADate, getTimelineChartHtml, type StudyConfiguration } from "@freon4dsl/study-configuration";
    import { get } from "svelte/store";
    import { dataStore } from "../../services/data/data-store.js";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { setDrawerTitle, setDrawerProps } from "../../services/stores/side-drawer-store.js";

    let { id, studyId, showAllPatients = false } = $props<{ id?: string; studyId: string; showAllPatients?: boolean }>();

    let isLoading = $state(true);
    let showChart = $state(false);
    let chartHtml = $state<string>("");
    let error = $state<string | null>(null);
    let container = $state<HTMLElement | null>(null);
    let timelineData = $state<any>(null);

    export function refresh() {
        if (showAllPatients || !id) {
            loadChartForAllPatients();
        } else {
            loadChartForOnePatient(id);
        }
    }

    // Update drawer title based on whether showing all patients or single patient
    $effect(() => {
        const title = (showAllPatients || !id) ? "All Patients Timeline" : "Patient Timeline";
        setDrawerTitle("patientTimelineChart", title);
    });

    $effect(() => {
        if (showAllPatients || !id) {
            loadChartForAllPatients();
        } else {
            loadChartForOnePatient(id);
        }
    });

    async function loadChartForOnePatient(patientId: string) {
        await loadChartWithTiming(
            () => getChartForOnePatient(undefined),
            `Error fetching chart data for study: ${patientId}`
        );
    }

    async function loadChartForAllPatients() {
        await loadChartWithTiming(
            () => getChartForAllPatients(undefined),
            `Error fetching chart data for all patients in study: ${studyId}`
        );
    }

    function getTimelineChartError() {
        const html = `<div class="limited-width-container"><div class='text-red-500'>Error: PatientInfo not found</div></div>`;
        return new RtString(html);
    }

    /**
     * Gets PatientInfo and StudyConfiguration units for a study.
     * Throws an error if either is not found.
     */
    async function getPatientAndStudyUnits(studyId: string): Promise<{ patientInfo: PatientInfo; studyConfig: StudyConfiguration }> {
        const modelManager = ModelManager.getInstance();
        
        const patientInfo = await modelManager.getModelUnitWithoutOpening(studyId, "PatientInfo") as PatientInfo;
        if (!patientInfo) {
            throw new Error(`PatientInfo unit not found for study: ${studyId}`);
        }
        
        const studyConfig = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;
        if (!studyConfig) {
            throw new Error(`StudyConfiguration unit not found for study: ${studyId}`);
        }
        
        return { patientInfo, studyConfig };
    }

    const getChartForOnePatient = async (referenceDate: Date | undefined) => {
        const fetchedPatient = await dataStore.getPatient(id);
        if (!fetchedPatient) {
            const rtObject = getTimelineChartError() as RtString;
            return rtObject.asString();
        }

        // Get study units
        const { patientInfo, studyConfig } = await getPatientAndStudyUnits(fetchedPatient.studyId);
        
        // Find and copy the matching patient history
        const originalHistory = findPatientHistoryByPatientNumber(patientInfo.patientHistories, fetchedPatient.patientNumber);
        if (!originalHistory) {
            console.warn("No matching patient history found so chart will just show study schedule!");
        }
        const patientHistory = originalHistory 
            ? copyPatientHistoryWithFilledDates(originalHistory)
            : PatientHistory.create({});
        
        // Determine reference date
        const referenceDateForTimeline = determineReferenceDate(referenceDate, patientHistory);

        // Get patient identifier for single patient view
        const patientIdentifier = fetchedPatient.patientNumber || fetchedPatient.id;
        const timeline = getTimelineAsOfADate(studyConfig, referenceDateForTimeline, patientHistory, patientIdentifier);
        
        // Store timeline data for JSON output (patient-centric with window data)
        const refDate = timeline.getReferenceDate();
        
        // Helper to get window info from scheduled event
        const getWindowInfo = (scheduledEvent: any) => {
            try {
                const daysBefore = scheduledEvent.getStartDayOfWindow ? scheduledEvent.getStartDayOfWindow() : 0;
                const daysAfter = scheduledEvent.getEndDayOfWindow ? scheduledEvent.getEndDayOfWindow() : 0;
                const hasBefore = scheduledEvent.anyDaysBefore ? scheduledEvent.anyDaysBefore() : false;
                const hasAfter = scheduledEvent.anyDaysAfter ? scheduledEvent.anyDaysAfter() : false;
                return {
                    daysBefore,
                    daysAfter,
                    hasBefore,
                    hasAfter
                };
            } catch (e) {
                return { daysBefore: 0, daysAfter: 0, hasBefore: false, hasAfter: false };
            }
        };
        
        // Get unique patient identifiers
        const uniquePatientIds = timeline.getUniquePatientIdentifiers();
        if (uniquePatientIds.length === 0) {
            uniquePatientIds.push(patientIdentifier);
        }
        
        // Build patient-centric structure
        const patientData: any = {};
        uniquePatientIds.forEach(pid => {
            patientData[pid] = {
                patientId: pid,
                referenceDate: refDate.toISOString(),
                days: []
            };
        });
        
        // Process each day
        timeline.getDays().forEach((day: any) => {
            const date = new Date(refDate);
            date.setDate(date.getDate() + day.day);
            const dayStr = date.toISOString().split('T')[0];
            
            // Get scheduled events with window info
            const scheduledEvents = day.getEventInstances().map((e: any) => {
                const windowInfo = getWindowInfo(e);
                return {
                    name: e.getName(),
                    title: e.getTitle ? e.getTitle() : null,
                    startDay: e.startDay,
                    window: windowInfo
                };
            });
            
            // Get patient events grouped by patient
            const patientEvents = day.getPatientEventInstances();
            const eventsByPatient = new Map<string, any[]>();
            patientEvents.forEach((e: any) => {
                const pid = e.getPatientIdentifier ? e.getPatientIdentifier() : 'unknown';
                if (!eventsByPatient.has(pid)) {
                    eventsByPatient.set(pid, []);
                }
                eventsByPatient.get(pid)!.push({
                    name: e.getName(),
                    title: e.getTitle ? e.getTitle() : null,
                    startDay: e.startDay,
                    stateClass: e.getClassForDisplay ? e.getClassForDisplay(timeline) : null
                });
            });
            
            // Add day to each patient's timeline
            uniquePatientIds.forEach(pid => {
                patientData[pid].days.push({
                    day: day.day,
                    date: dayStr,
                    scheduledEvents: scheduledEvents,
                    patientEvents: eventsByPatient.get(pid) || []
                });
            });
        });
        
        timelineData = {
            referenceDate: refDate.toISOString(),
            note: "Reference date is day 0 for each patient. Days are relative to this date.",
            patients: Object.values(patientData)
        };
        
        const html = getTimelineChartHtml(timeline).asString();
        return html;
    };

    const getChartForAllPatients = async (referenceDate: Date | undefined) => {
        // Get all patients for the study
        await dataStore.getStudyPatients(studyId);
        const storeState = get(dataStore);
        const allPatients = storeState.studyPatients.filter(p => p.studyId === studyId);
        
        if (allPatients.length === 0) {
            return `<div class="limited-width-container"><div class='text-yellow-500'>No patients found for this study</div></div>`;
        }

        // Get study units
        const { patientInfo, studyConfig } = await getPatientAndStudyUnits(studyId);

        // Determine reference date from first patient visit if available
        // Find the first patient history with visits to use as reference
        const firstPatientHistoryWithVisits = findFirstPatientHistoryWithVisits(patientInfo.patientHistories, allPatients);
        
        const referenceDateForTimeline = determineReferenceDate(referenceDate, firstPatientHistoryWithVisits);
        console.log("referenceDateForTimeline", referenceDateForTimeline);

        // Create timeline with study configuration
        const timeline = getTimelineAsOfADate(studyConfig, referenceDateForTimeline, undefined);

        // Add events for all patients
        for (const patient of allPatients) {
            const originalHistory = findPatientHistoryByPatientNumber(patientInfo.patientHistories, patient.patientNumber);
            if (originalHistory) {
                const copiedHistory = copyPatientHistoryWithFilledDates(originalHistory);
                // Add patient events to timeline with patient identifier (use initials or patient number)
                const patientIdentifier = patient.initials || patient.patientNumber;
                timeline.addPatientEvents(copiedHistory, patientIdentifier);
            }
        }

        // Store timeline data for JSON output (patient-centric with window data)
        const refDate = timeline.getReferenceDate();
        
        // Helper to get window info from scheduled event
        const getWindowInfo = (scheduledEvent: any) => {
            try {
                const daysBefore = scheduledEvent.getStartDayOfWindow ? scheduledEvent.getStartDayOfWindow() : 0;
                const daysAfter = scheduledEvent.getEndDayOfWindow ? scheduledEvent.getEndDayOfWindow() : 0;
                const hasBefore = scheduledEvent.anyDaysBefore ? scheduledEvent.anyDaysBefore() : false;
                const hasAfter = scheduledEvent.anyDaysAfter ? scheduledEvent.anyDaysAfter() : false;
                return {
                    daysBefore,
                    daysAfter,
                    hasBefore,
                    hasAfter
                };
            } catch (e) {
                return { daysBefore: 0, daysAfter: 0, hasBefore: false, hasAfter: false };
            }
        };
        
        // Get unique patient identifiers
        const uniquePatientIds = timeline.getUniquePatientIdentifiers();
        if (uniquePatientIds.length === 0) {
            allPatients.forEach(p => {
                const pid = p.displayName || p.name || p.patientNumber;
                if (pid && !uniquePatientIds.includes(pid)) {
                    uniquePatientIds.push(pid);
                }
            });
        }
        
        // Build patient-centric structure
        const patientData: any = {};
        uniquePatientIds.forEach(pid => {
            patientData[pid] = {
                patientId: pid,
                referenceDate: refDate.toISOString(),
                days: []
            };
        });
        
        // Process each day
        timeline.getDays().forEach((day: any) => {
            const date = new Date(refDate);
            date.setDate(date.getDate() + day.day);
            const dayStr = date.toISOString().split('T')[0];
            
            // Get scheduled events with window info
            const scheduledEvents = day.getEventInstances().map((e: any) => {
                const windowInfo = getWindowInfo(e);
                return {
                    name: e.getName(),
                    title: e.getTitle ? e.getTitle() : null,
                    startDay: e.startDay,
                    window: windowInfo
                };
            });
            
            // Get patient events grouped by patient
            const patientEvents = day.getPatientEventInstances();
            const eventsByPatient = new Map<string, any[]>();
            patientEvents.forEach((e: any) => {
                const pid = e.getPatientIdentifier ? e.getPatientIdentifier() : 'unknown';
                if (!eventsByPatient.has(pid)) {
                    eventsByPatient.set(pid, []);
                }
                eventsByPatient.get(pid)!.push({
                    name: e.getName(),
                    title: e.getTitle ? e.getTitle() : null,
                    startDay: e.startDay,
                    stateClass: e.getClassForDisplay ? e.getClassForDisplay(timeline) : null
                });
            });
            
            // Add day to each patient's timeline
            uniquePatientIds.forEach(pid => {
                patientData[pid].days.push({
                    day: day.day,
                    date: dayStr,
                    scheduledEvents: scheduledEvents,
                    patientEvents: eventsByPatient.get(pid) || []
                });
            });
        });
        
        timelineData = {
            referenceDate: refDate.toISOString(),
            note: "Reference date is day 0 for each patient. Days are relative to this date.",
            patients: Object.values(patientData)
        };

        const html = getTimelineChartHtml(timeline).asString();
        return html;
    };

    /**
     * Executes script tags that are embedded in the chart HTML.
     * 
     * Background:
     * When HTML is inserted via innerHTML, the browser does NOT execute any <script> tags
     * for security reasons. The timeline chart HTML contains JavaScript code that needs to
     * run to initialize the Vis.js timeline visualization. This function manually extracts
     * those script tags and re-executes them.
     * 
     * Process:
     * 1. Waits for the vis-timeline library to be loaded (from the CDN in <svelte:head>)
     * 2. Finds all <script> tags in the container
     * 3. For each script, creates a new script element and copies the content
     * 4. Replaces the old script with the new one (this triggers execution)
     * 5. Waits for the next animation frame to ensure scripts have executed
     * 
     * Why replace instead of just creating new scripts?
     * - Scripts that are inserted via innerHTML are not executed
     * - Replacing them with newly created script elements causes the browser to execute them
     * 
     * @returns Promise that resolves when all scripts have been executed
     */
    function executeEmbeddedChartScripts() {
        return new Promise<void>((resolve) => {
            if (container) {
                /**
                 * Polls for the vis-timeline library to be available before executing scripts.
                 * The library is loaded asynchronously from a CDN, so we need to wait for it.
                 */
                const waitForVis = () => {
                    // Check if vis-timeline library is loaded
                    if (typeof (window as any).vis !== 'undefined') {
                        // Find all script tags in the container (these were inserted via innerHTML)
                        const scripts = container!.querySelectorAll("script");
                        
                        // For each script tag, create a new one and replace the old one
                        // This is necessary because scripts inserted via innerHTML are not executed
                        scripts.forEach((oldScript) => {
                            const newScript = document.createElement("script");
                            newScript.textContent = oldScript.textContent;
                            // Replacing the old script with a new one triggers execution
                            oldScript.replaceWith(newScript);
                        });
                        
                        // Wait for the next animation frame to ensure:
                        // 1. The DOM has been updated with the new script elements
                        // 2. The scripts have had time to execute
                        // 3. Any timeline initialization code has completed
                        requestAnimationFrame(() => {
                            resolve();
                        });
                    } else {
                        // vis library not loaded yet, check again in 50ms
                        setTimeout(waitForVis, 50);
                    }
                };
                
                // Start polling for the vis library
                waitForVis();
            } else {
                // No container available, resolve immediately
                resolve();
            }
        });
    }

    /**
     * Common loading pattern for both single patient and all patients views.
     * Ensures minimum display time and handles errors consistently.
     */
    async function loadChartWithTiming(chartFunction: () => Promise<string>, errorContext: string) {
        isLoading = true;
        showChart = false;
        error = null;
        try {
            const startTime = Date.now();
            chartHtml = await chartFunction();
            await new Promise((resolve) => setTimeout(() => resolve(null), 0)); // Allow DOM to update
            await renderChart();
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 5000) {
                await new Promise((resolve) => setTimeout(resolve, 5000 - elapsedTime));
            }
            showChart = true;
        } catch (err: unknown) {
            console.error(errorContext, err);
            error = err instanceof Error ? err.message : "An error occurred while fetching chart data";
        } finally {
            isLoading = false;
        }
    }

    /**
     * Renders the chart HTML into the DOM container and executes embedded scripts.
     * The chartHtml is already generated at this point - this function just displays it.
     */
    async function renderChart() {
        if (container) {
            container.innerHTML = chartHtml;
            await executeEmbeddedChartScripts(); // Wait for scripts to actually execute
            
            // Add event listener for patient timeline clicks (only for multi-patient view)
            if (showAllPatients || !id) {
                const visualizationDiv = container.querySelector('#visualization');
                if (visualizationDiv) {
                    visualizationDiv.addEventListener('openPatientTimeline', async (event: any) => {
                        const patientIdentifier = event.detail?.patientId;
                        if (patientIdentifier) {
                            // Find the patient by identifier (could be patient number, display name, etc.)
                            await dataStore.getStudyPatients(studyId);
                            const storeState = get(dataStore);
                            const allPatients = storeState.studyPatients.filter(p => p.studyId === studyId);
                            
                            // Try to find patient by patient number or initials
                            const patient = allPatients.find(p => 
                                p.patientNumber === patientIdentifier || 
                                p.initials === patientIdentifier
                            );
                            
                            if (patient) {
                                // Update drawer props to show this specific patient
                                setDrawerProps("patientTimelineChart", { 
                                    id: patient.id, 
                                    studyId: studyId, 
                                    showAllPatients: false 
                                });
                            }
                        }
                    });
                }
            }
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
        
        <!-- Raw Timeline Data Output (for debugging) -->
        {#if timelineData}
            <div class="simulation-data-output" style="margin-top: 1rem; padding: 1rem; background-color: #ffffff; border: 1px solid var(--calendar-day-border); border-radius: 4px; max-height: 400px; overflow-y: scroll;">
                <h3 style="margin-top: 0; margin-bottom: 0.5rem;">Raw Timeline Data (JSON) - Old Drawer</h3>
                <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 0.75rem;">{JSON.stringify(timelineData, null, 2)}</pre>
            </div>
        {/if}
    </div>
{/if}