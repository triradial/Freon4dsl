<script lang="ts">
    import { onMount } from "svelte";
    import PatientCard from "../components/cards/PatientCard.svelte";

    import { Tabs, TabItem, ListPlaceholder } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faListCheck, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
    import { getPatient, type Patient } from "../services/dataStore";

    import { EditorState } from "@freon4dsl/webapp-lib";
    import { RtString } from "@freon4dsl/core";
    import { type StudyConfiguration } from "@freon4dsl/samples-study-configuration";
    import { getTimelineChart } from "../services/app/PatientTimeline";

    export let id: string;
    let patient: Patient;

    let isLoading = true;
    let showChart = false;
    let chartHtml: string = "";
    let error: string | null = null;
    let container: HTMLElement | null = null;

    onMount(async () => {
        const fetchedPatient = await getPatient(id);
        if (fetchedPatient) {
            patient = fetchedPatient;
        } else {
            console.error(`Patient with id ${id} not found`);
        }
        await loadChart(patient.studyId); /* TODO: change to patient.id */
    });

    async function loadChart(id: string) {
        isLoading = true;
        showChart = false;
        error = null;
        try {
            const startTime = Date.now();
            chartHtml = await getChart(id);
            await new Promise((resolve) => setTimeout(() => resolve(null), 0)); // Allow DOM to update
            if (container) {
                await loadChartData();
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < 3000) {
                    await new Promise((resolve) => setTimeout(resolve, 5000 - elapsedTime));
                }
                showChart = true;
            } else {
                console.error("Container not found");
                throw new Error("Container not available");
            }
        } catch (err: unknown) {
            console.error(`Error fetching chart data for study: ${id}`, err);
            error = err instanceof Error ? err.message : "An error occurred while fetching chart data";
        } finally {
            isLoading = false;
        }
    }

    async function getChart(id: string) {
        const modelManager = EditorState.getInstance();
        const unit = (await modelManager.openUnitForModel(id, "StudyConfiguration")) as StudyConfiguration;
        const rtObject = getTimelineChart(unit) as RtString;
        return rtObject.asString();
    }

    async function loadChartData() {
        return new Promise<void>((resolve) => {
            if (container) {
                container.innerHTML = chartHtml;
                executeScripts();
            }
            resolve();
        });
    }

    function executeScripts() {
    if (container) {
        const scripts = container.querySelectorAll("script");
        scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
            
            // Wrap the script content in a function that checks for vis
            const wrappedContent = `
                (function checkVis() {
                    if (typeof vis !== 'undefined') {
                        ${oldScript.innerHTML}
                    } else {
                        setTimeout(checkVis, 100);
                    }
                })();
            `;         
            newScript.appendChild(document.createTextNode(wrappedContent));
            if (oldScript.parentNode) {
                oldScript.parentNode.replaceChild(newScript, oldScript);
            }
        });
    }
}
</script>

{#if patient}
    <div class="crc-container">
        <div class="crc-card">
            <PatientCard {patient} />
        </div>

        <div class="crc-content">
            <Tabs tabStyle="pill" class="crc-tab">
                <TabItem open title="Schedule" on:click={() => loadChart(patient.studyId)}>
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarDays} class="w-4 h-4" />Schedule
                    </div>
                    <div style="display: {isLoading || !showChart ? 'block' : 'none'}">
                        <ListPlaceholder class="mb-4" />
                    </div>
                    <div style="display: {!isLoading && showChart ? 'block' : 'none'}">
                        <div bind:this={container}>
                            {@html chartHtml}
                        </div>
                    </div>
                </TabItem>
                <TabItem title="Tasks">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faListCheck} class="w-4 h-4" />Tasks
                    </div>
                    <div class="crc-grid"></div>
                </TabItem>
            </Tabs>
        </div>
    </div>
{:else}
    <p>Loading patient...</p>
{/if}
