<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { onMount } from "svelte";
    import type { FreError } from "@freon4dsl/core";
    import { FreLogger } from "@freon4dsl/core";
    // @ts-ignore
    import { ArrowUpRight as IconArrowUpRight, X as IconX } from '@lucide/svelte';

    const dispatch = createEventDispatcher();
    let modelErrors = $state<FreError[]>([]);

    const LOGGER = new FreLogger("DSLErrorsDrawer");

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
            return `${capitalizedType} ${message.charAt(0).toLowerCase()}${message.slice(1)}`;
        }
        
        return message;
    }

    onMount(() => {
        modelErrors = ModelManager.getInstance().runValidator();
        LOGGER.log(`onMount modelErrors: ${modelErrors.length}`);
    });

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        modelErrors = ModelManager.getInstance().runValidator();
        dispatch("refresh");
        LOGGER.log(`refresh errors: ${modelErrors.length}`);
    }

    let selected: number = 0;
    $effect(() => {
        LOGGER.log(`Effect: handleClick, selected: ${selected}`);
        handleClick(selected);
    });

    const handleClick = (index: number) => {
        if (!!modelErrors && modelErrors.length > 0) {
            const item: FreError = modelErrors[index];
            const node = Array.isArray(item.reportedOn) ? item.reportedOn[0] : item.reportedOn;
            
            if (node) {
                const conceptType = getConceptType(item);
                LOGGER.log(`Navigating to error: ${item.message}`);
                LOGGER.log(`  Concept type: ${conceptType}`);
                LOGGER.log(`  Node type: ${node.freLanguageConcept?.()}, ID: ${node.freId?.()}`);
                LOGGER.log(`  Property: ${item.propertyName}`);
                
                try {
                    ModelManager.getInstance().selectElement(node, item.propertyName);
                    LOGGER.log(`Navigation attempted for ${conceptType}`);
                } catch (e) {
                    LOGGER.error(`Failed to navigate to error location: ${e}`);
                }
            } else {
                LOGGER.error(`Cannot navigate: error has no reportedOn node`);
            }
        }
    };
</script>

<style>
    .error-drawer-head {
        text-align: left;
    }
</style>

<div class="drawer-content-area">
    <div class="table-wrap">
        <table class="table table-hover table-striped error-drawer">
            <thead>
                <tr class="error-drawer-row">
                    <th class="error-drawer-head">Message</th>
                    <th class="error-drawer-head">Severity</th>
                </tr>
            </thead>
            <tbody>
                {#if modelErrors.length === 0}
                    <tr class="error-drawer-row">
                        <td class="error-drawer-cell" colspan="2">No errors found</td>
                    </tr>
                {/if}
                {#each modelErrors as error, index}
                    <tr class="error-drawer-row">
                        <td class="error-drawer-cell">
                            <div class="flex items-center gap-2">
                                <button type="button" class="icon-button" onclick={() => handleClick(index)} title="Locate in model"><IconArrowUpRight /></button>
                                <span>{formatErrorMessage(error)}</span>
                            </div>
                        </td>
                        <td class="error-drawer-cell">{error.severity}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
