<script lang="ts">
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { onMount, onDestroy } from "svelte";
    import type { FreError } from "@freon4dsl/core";
    import { FreLogger } from "@freon4dsl/core";
    // @ts-ignore
    import { Locate as IconLocate } from '@lucide/svelte';

    let { studyId } = $props<{ studyId: string }>();
    let modelErrors = $state<FreError[]>([]);
    let errorCount = $derived(modelErrors.length);
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    let refreshIdleCallback: number | null = null;
    let isRefreshing = $state(false);

    const LOGGER = new FreLogger("StudyDesignErrors");

    // Run validator asynchronously to avoid blocking UI
    function runValidatorAsync(): Promise<FreError[]> {
        return new Promise((resolve) => {
            // Use requestIdleCallback if available, otherwise setTimeout
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => {
                    const errors = ModelManager.getInstance().runValidator();
                    resolve(errors);
                }, { timeout: 1000 });
            } else {
                setTimeout(() => {
                    const errors = ModelManager.getInstance().runValidator();
                    resolve(errors);
                }, 0);
            }
        });
    }

    // Debounced refresh function
    function debouncedRefresh() {
        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
            refreshTimeout = null;
        }
        if (refreshIdleCallback !== null && typeof cancelIdleCallback !== 'undefined') {
            cancelIdleCallback(refreshIdleCallback);
            refreshIdleCallback = null;
        }

        refreshTimeout = setTimeout(() => {
            isRefreshing = true;
            runValidatorAsync().then((errors) => {
                modelErrors = errors;
                isRefreshing = false;
                LOGGER.log(`async refresh errors: ${modelErrors.length}`);
            });
        }, 300); // 300ms debounce
    }

    onMount(() => {
        // Initial load - run immediately but still async
        isRefreshing = true;
        runValidatorAsync().then((errors) => {
            modelErrors = errors;
            isRefreshing = false;
            LOGGER.log(`onMount modelErrors: ${modelErrors.length}`);
        });
    });

    // React to studyId changes
    $effect(() => {
        studyId; // Track studyId changes
        debouncedRefresh();
    });

    export function refresh() {
        debouncedRefresh();
    }

    onDestroy(() => {
        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
            refreshTimeout = null;
        }
        if (refreshIdleCallback !== null && typeof cancelIdleCallback !== 'undefined') {
            cancelIdleCallback(refreshIdleCallback);
            refreshIdleCallback = null;
        }
    });

    const handleClick = (index: number) => {
        if (!!modelErrors && modelErrors.length > 0) {
            const item: FreError = modelErrors[index];
            // TODO declaredType should be changed to property coming from error object.
            if (Array.isArray(item.reportedOn)) {
                ModelManager.getInstance().selectElement(item.reportedOn[0], item.propertyName);
            } else {
                ModelManager.getInstance().selectElement(item.reportedOn, item.propertyName);
            }
        }
    };
</script>

<div class="table-wrap">
    <table class="table table-hover table-striped model-error">
        <thead>
            <tr class="model-error-row">
                <th class="model-error-head">#</th>
                <th class="model-error-head">Message</th>
                <th class="model-error-head">Severity</th>
                <th class="model-error-head"></th>
            </tr>
        </thead>
        <tbody>
            {#if modelErrors.length === 0}
                <tr class="model-error-row">
                    <td class="model-error-cell" colspan="4">No errors found</td>
                </tr>
            {/if}
            {#each modelErrors as error, index}
                <tr class="model-error-row">
                    <td class="model-error-cell">{index + 1}</td>
                    <td class="model-error-cell">
                        <span>{error.message}</span>
                    </td>
                    <td class="model-error-cell">{error.severity}</td>
                    <td class="model-error-cell">
                        <button type="button" class="icon-button model-error-button" onclick={() => handleClick(index)} title="Locate in model">
                            <IconLocate />
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
