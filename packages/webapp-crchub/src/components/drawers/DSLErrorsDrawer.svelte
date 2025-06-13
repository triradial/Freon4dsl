<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { onMount } from "svelte";
    import type { FreError } from "@freon4dsl/core";
    // @ts-ignore
    import { ArrowUpRight as IconArrowUpRight, X as IconX } from '@lucide/svelte';

    const dispatch = createEventDispatcher();
    let modelErrors = $state<FreError[]>([]);

    onMount(() => {
        modelErrors = ModelManager.getInstance().runValidator();
        console.log("[DSLErrorsDrawer] onMount modelErrors:", modelErrors.length);
    });

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        modelErrors = ModelManager.getInstance().runValidator();
        dispatch("refresh");
        console.log("DSLErrorsDrawer refresh errors", modelErrors.length);
    }

    let selected: number = 0;
    $effect(() => {
        console.log("[DSLErrorsDrawer] $effect handleClick, selected:", selected);
        handleClick(selected);
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

<div class="drawer-content-area">
    <div class="table-wrap">
        <table class="table table-hover table-striped">
            <thead>
                <tr>
                    <th class="bg-surface-500-900">Message</th>
                    <th class="bg-surface-500-900">Severity</th>
                </tr>
            </thead>
            <tbody>
                {#each modelErrors as error, index}
                    <tr class="hover:bg-surface-500-900/50">
                        <td>
                            <div class="flex items-center gap-2">
                                <button type="button" class="icon-button btn-sm" onclick={() => handleClick(index)}><IconArrowUpRight /></button>
                                <span>{error.message}</span>
                            </div>
                        </td>
                        <td>{error.severity}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
