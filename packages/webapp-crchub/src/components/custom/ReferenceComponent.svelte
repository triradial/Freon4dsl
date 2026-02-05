<script lang="ts">
    import { AST, FragmentWrapperBox, FreLogger, FreNodeReference, ownerOfType } from "@freon4dsl/core";
    import { componentId, RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { Event, SharedTask, TaskReference, Task, SystemAccess, SystemAccessReference, UnscheduledEvent, type StudyConfiguration } from "@freon4dsl/study-configuration";
    import { onMount } from "svelte";
    import { Share2 as IconShare } from '@lucide/svelte';
    import SelectableWrapperComponent from "./freon/SelectableWrapperComponent.svelte";

    const LOGGER = new FreLogger("ReferenceComponent");

    let { editor, box }: FreComponentProps<FragmentWrapperBox> = $props();

    // Extract props from box params - use $derived to properly react to box changes
    let cssClass = $derived(box?.findParam("cssClass") || "");
    let canDelete = $derived(box?.findParam("canDelete") === "true");
    let canShare = $derived(box?.findParam("canShare") === "true");
    let inlineDisplay = $derived(box?.findParam("inlineDisplay") === "true");
    let hideDragHandle = $derived(box?.findParam("hideDragHandle") === "true");

    // Set hideDragHandle on the box so ListComponent can check it
    $effect(() => {
        if (box && hideDragHandle) {
            box.hideDragHandle = true;
        }
    });

    // State
    let id = $derived(box ? componentId(box) : 'reference-unknown');
    let wrapperElement: HTMLDivElement | HTMLSpanElement | undefined = $state();

    // Determine if this node can be shared (is a Task or SystemAccess)
    let canBeShared = $derived.by(() => {
        if (!canShare) return false;
        const node = box?.node;
        if (!node) return false;
        const concept = node.freLanguageConcept();
        return concept === "Task" || concept === "SystemAccess";
    });

    const refresh = (why?: string): void => {
        LOGGER.log("REFRESH (" + why + ")");
        box.childBox?.refreshComponent?.(why);
    };

    onMount(() => {
        if (box) {
            box.refreshComponent = refresh;
        }
    });

    $effect(() => {
        if (box) {
            box.refreshComponent = refresh;
        }
    });

    // Delete handler to pass to SelectableWrapperComponent
    const handleDelete = () => {
        AST.change(() => {
            const ownerDescriptor = box.node.freOwnerDescriptor();
            const parent = ownerDescriptor.owner;
            const propertyName = ownerDescriptor.propertyName;
            const index = ownerDescriptor.propertyIndex;

            if (parent && propertyName && typeof index === "number" && index >= 0) {
                parent[propertyName].splice(index, 1);
                LOGGER.log(`Deleted item at index ${index} from ${propertyName}`);
            } else {
                LOGGER.error("Could not determine parent, property name, or index for deletion");
            }
        });
    };

    // Share handler - converts Task to SharedTask or SystemAccess to SystemAccessReference
    const handleShare = (event: MouseEvent | KeyboardEvent) => {
        event.stopPropagation();
        event.preventDefault();

        const node = box.node;
        const concept = node.freLanguageConcept();

        if (concept === "Task") {
            shareTask(node as Task);
        } else if (concept === "SystemAccess") {
            shareSystemAccess(node as SystemAccess);
        }
    };

    // Convert a Task to a SharedTask and replace with TaskReference
    function shareTask(task: Task) {
        const studyConfig: StudyConfiguration = ownerOfType(task, "StudyConfiguration") as StudyConfiguration;

        // Tasks can be in Event.tasks or UnscheduledEvent.tasks - try both
        let eventObj: Event | UnscheduledEvent | null = ownerOfType(task, "Event") as Event | null;
        if (!eventObj) {
            eventObj = ownerOfType(task, "UnscheduledEvent") as UnscheduledEvent | null;
        }

        if (!studyConfig || !eventObj) {
            LOGGER.error("Could not find StudyConfiguration or Event/UnscheduledEvent for task");
            return;
        }

        AST.change(() => {
            // Create the shared task with copied data
            const newSharedTask = SharedTask.create({
                name: task.name,
                description: task.description,
                numberedSteps: task.numberedSteps,
                showDetails: task.showDetails,
                steps: task.steps.map((step) => step.copy()),
            });

            // Create reference to the new shared task
            const refToTask = FreNodeReference.create(task.name, "SharedTask") as FreNodeReference<SharedTask>;
            refToTask.referred = newSharedTask;

            const newTaskReference = TaskReference.create({
                task: refToTask
            });

            // Replace the original task in the event with the new task reference
            const taskIndex = eventObj.tasks.indexOf(task);
            if (taskIndex >= 0) {
                eventObj.tasks[taskIndex] = newTaskReference;
            }

            // Add the new shared task to the study's shared tasks list
            studyConfig.tasks.push(newSharedTask);

            LOGGER.log(`Converted Task "${task.name}" to SharedTask`);
        });
    }

    // Convert a SystemAccess to a shared SystemAccess and replace with SystemAccessReference
    function shareSystemAccess(systemAccess: SystemAccess) {
        const studyConfig: StudyConfiguration = ownerOfType(systemAccess, "StudyConfiguration") as StudyConfiguration;
        const ownerDescriptor = systemAccess.freOwnerDescriptor();
        const parent = ownerDescriptor.owner;
        const propertyName = ownerDescriptor.propertyName;
        const index = ownerDescriptor.propertyIndex;

        if (!studyConfig || !parent || !propertyName) {
            LOGGER.error("Could not find StudyConfiguration or parent for SystemAccess");
            return;
        }

        AST.change(() => {
            // Mark the system access as shared and move it to the study level
            const sharedSystemAccess = SystemAccess.create({
                name: systemAccess.name,
                description: systemAccess.description,
                isShared: true,
                functionName: systemAccess.functionName,
                accessedAt: systemAccess.accessedAt,
            });

            // Create reference to the shared system access
            const refToSystem = FreNodeReference.create(systemAccess.name, "SystemAccess") as FreNodeReference<SystemAccess>;
            refToSystem.referred = sharedSystemAccess;

            const newSystemAccessReference = SystemAccessReference.create({
                system: refToSystem
            });

            // Replace the original system access with the reference
            if (typeof index === "number" && index >= 0) {
                (parent as any)[propertyName][index] = newSystemAccessReference;
            }

            // Add the shared system access to the study's systemAccesses list
            studyConfig.systemAccesses.push(sharedSystemAccess);

            LOGGER.log(`Converted SystemAccess "${systemAccess.name}" to shared SystemAccess`);
        });
    }
</script>

{#if inlineDisplay}
    <!-- Inline span display for truly inline text -->
    <span
        bind:this={wrapperElement}
        {id}
        class="inline-reference {cssClass}"
        role="group"
    >
        <SelectableWrapperComponent {box} {editor} onDelete={canDelete ? handleDelete : undefined}>
            <span class="reference-content-inline">
                <RenderComponent box={box.childBox} {editor} />
                {#if canBeShared}
                    <button
                        class="share-button-inline"
                        onclick={handleShare}
                        onkeydown={(e) => e.key === 'Enter' && handleShare(e)}
                        title="Convert to shared"
                        tabindex="0"
                    >
                        <IconShare size={12} />
                    </button>
                {/if}
            </span>
        </SelectableWrapperComponent>
    </span>
{:else}
    <!-- Block display with selection box from SelectableWrapperComponent -->
    <div
        bind:this={wrapperElement}
        {id}
        class="reference-item {cssClass}"
        role="group"
    >
        <SelectableWrapperComponent {box} {editor} onDelete={canDelete ? handleDelete : undefined}>
            <div class="reference-item-content">
                <RenderComponent box={box.childBox} {editor} />
                {#if canBeShared}
                    <button
                        class="share-button"
                        onclick={handleShare}
                        onkeydown={(e) => e.key === 'Enter' && handleShare(e)}
                        title="Convert to shared"
                        tabindex="0"
                    >
                        <IconShare size={14} />
                    </button>
                {/if}
            </div>
        </SelectableWrapperComponent>
    </div>
{/if}

<style>
    /* Block display style */
    .reference-item {
        position: relative;
        display: block;
    }

    .reference-item-content {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    /* Inline display style */
    .inline-reference {
        display: inline;
        position: relative;
    }

    .reference-content-inline {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    /* Share button styles */
    .share-button,
    .share-button-inline {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.125rem;
        border: none;
        background: transparent;
        color: var(--fgColor-muted, #666);
        cursor: pointer;
        border-radius: 0.25rem;
        opacity: 0.6;
        transition: opacity 0.15s, color 0.15s;
    }

    .share-button:hover,
    .share-button-inline:hover {
        opacity: 1;
        color: var(--primary-color, #3b82f6);
    }

    .share-button:focus,
    .share-button-inline:focus {
        outline: 2px solid var(--primary-color, #3b82f6);
        outline-offset: 1px;
    }
</style>
