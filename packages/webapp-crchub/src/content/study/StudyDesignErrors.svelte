<script lang="ts">
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { onMount } from "svelte";
    import type { FreError } from "@freon4dsl/core";
    import { FreLogger } from "@freon4dsl/core";
    // @ts-ignore
    import { ArrowUpRight as IconArrowUpRight } from '@lucide/svelte';

    let { studyId } = $props<{ studyId: string }>();
    let modelErrors = $state<FreError[]>([]);
    let errorCount = $derived(modelErrors.length);

    const LOGGER = new FreLogger("StudyDesignErrors");

    onMount(() => {
        modelErrors = ModelManager.getInstance().runValidator();
        LOGGER.log("onMount modelErrors:", modelErrors.length);
    });

    export function refresh() {
        modelErrors = ModelManager.getInstance().runValidator();
        LOGGER.log("refresh errors", modelErrors.length);
    }

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
                            <button type="button" class="icon-button" onclick={() => handleClick(index)}><IconArrowUpRight /></button>
                            <span>{error.message}</span>
                        </div>
                    </td>
                    <td class="error-drawer-cell">{error.severity}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
