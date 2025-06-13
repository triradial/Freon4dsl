<script lang="ts">
    import { onMount } from "svelte";
    import PatientCard from "../components/cards/PatientCard.svelte";
    import { Tabs } from '@skeletonlabs/skeleton-svelte';
    import { CalendarDays as IconCalendarDays, ListTodo as IconListTodo } from '@lucide/svelte';
    import { dataStore, type Patient } from "../services/data/data-store.js";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { RtString } from "@freon4dsl/core";
    import { getTimelineChart } from "../services/app/patient-timeline.js";
    import { StudyConfiguration } from "@freon4dsl/study-configuration";
    import { getChartWithPatientHistory } from "../services/utils.js";

    let { id } = $props<{ id: string }>();

    let patient = $state<Patient | undefined>(undefined);
    let isLoading = $state(true);
    let showChart = $state(false);
    let chartHtml = $state<string>("");
    let error = $state<string | null>(null);
    let container = $state<HTMLElement | null>(null);
    let activeTab = $state('schedule');

    onMount(async () => {
        const fetchedPatient = await dataStore.getPatient(id);
        if (fetchedPatient) {
            patient = fetchedPatient;
            await loadChart(patient.studyId);
        } else {
            console.error(`Patient with id ${id} not found`);
        }
    });

    async function loadChart(id: string) {
        isLoading = true;
        showChart = false;
        error = null;
        try {
            const startTime = Date.now();
            console.log("calling getChartWithPatientHistory");
            chartHtml = await getChartWithPatientHistory(id);
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
        const modelManager = ModelManager.getInstance();
        const unit = (await modelManager.openModelUnit(id, "StudyConfiguration")) as StudyConfiguration;
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
            <Tabs value={activeTab} onValueChange={(e) => {
                activeTab = e.value;
                if (e.value === 'schedule' && patient) {
                    loadChart(patient.studyId);
                }
            }}>
                {#snippet list()}
                    <Tabs.Control value="schedule">
                        <div class="flex items-center gap-2"><IconCalendarDays />Schedule</div>
                    </Tabs.Control>
                    <Tabs.Control value="tasks">
                        <div class="flex items-center gap-2"><IconListTodo />Tasks</div>
                    </Tabs.Control>
                {/snippet}

                {#snippet content()}
                    <Tabs.Panel value="schedule">
                        <div style="display: {isLoading || !showChart ? 'block' : 'none'}">
                            <div class="placeholder animate-pulse mb-4"></div>
                        </div>
                        <div style="display: {!isLoading && showChart ? 'block' : 'none'}">
                            <div bind:this={container}>
                                {@html chartHtml}
                            </div>
                        </div>
                    </Tabs.Panel>
                    <Tabs.Panel value="tasks">
                        <div class="crc-grid"></div>
                    </Tabs.Panel>
                {/snippet}
            </Tabs>
        </div>
    </div>
{:else}
    <div class="h-full crc-content-width">
        <div class="placeholder animate-pulse"></div>
    </div>
{/if}
