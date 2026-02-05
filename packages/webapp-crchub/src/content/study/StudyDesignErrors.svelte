<script lang="ts">
    import type { FreError } from "@freon4dsl/core";
    import { onDestroy, onMount } from "svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
// @ts-ignore
    import { Locate as IconLocate } from '@lucide/svelte';

    let { studyId } = $props<{ studyId: string }>();
    let modelErrors = $state<FreError[]>([]);
    let errorCount = $derived(modelErrors.length);
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    let refreshIdleCallback: number | null = null;
    let isRefreshing = $state(false);

    /**
     * Convert camelCase or PascalCase to readable format.
     * e.g., "eventStart" → "event start", "EventSchedule" → "Event Schedule"
     */
    function toReadable(str: string): string {
        if (!str) return str;
        return str
            .replace(/([a-z])([A-Z])/g, '$1 $2')  // Insert space before capitals
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')  // Handle consecutive capitals
            .toLowerCase();
    }

    /**
     * Get the concept type from an error for prefixing the message.
     * Returns readable format like "Event" or "Event schedule"
     */
    function getConceptType(error: FreError): string {
        const node = Array.isArray(error.reportedOn) ? error.reportedOn[0] : error.reportedOn;
        if (!node) return '';
        
        try {
            const conceptType = node.freLanguageConcept?.() || '';
            return toReadable(conceptType);
        } catch (e) {
            return '';
        }
    }

    /**
     * Format the error message with concept type prefix and readable property names.
     * e.g., "Property 'eventStart' must have a value" → "Event schedule property 'event start' must have a value"
     */
    function formatErrorMessage(error: FreError): string {
        const conceptType = getConceptType(error);
        let message = error.message;
        
        // Convert property names in the message to readable format
        // Matches patterns like 'propertyName' or "propertyName"
        message = message.replace(/'([^']+)'/g, (match, propName) => {
            return `'${toReadable(propName)}'`;
        });
        
        // Prefix with concept type if available
        if (conceptType) {
            // Capitalize first letter of concept type
            const capitalizedType = conceptType.charAt(0).toUpperCase() + conceptType.slice(1);
            // Remove the first instance of 'property ' since the concept type already provides context
            let trimmedMessage = message.charAt(0).toLowerCase() + message.slice(1);
            trimmedMessage = trimmedMessage.replace(/property /, '');
            return `${capitalizedType} ${trimmedMessage}`;
        }
        
        return message;
    }

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
            });
        }, 300); 
    }

    onMount(() => {
        // Initial load - run immediately but still async
        isRefreshing = true;
        runValidatorAsync().then((errors) => {
            modelErrors = errors;
            isRefreshing = false;
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
        if (!modelErrors || modelErrors.length === 0) {
            return;
        }
        
        const item: FreError = modelErrors[index];
        const node = Array.isArray(item.reportedOn) ? item.reportedOn[0] : item.reportedOn;
        
        if (!node) {
            return;
        }
        
        const modelManager = ModelManager.getInstance();
        modelManager.selectElement(node, item.propertyName);
    };
</script>

<style>
    .model-error-head {
        text-align: left;
    }
</style>

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
                        <span>{formatErrorMessage(error)}</span>
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
