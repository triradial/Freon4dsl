<script lang="ts">
    import { AST, Box, FragmentBox, FragmentWrapperBox, FreLogger, FreNodeReference, ownerOfType, TextBox, VerticalLayoutBox } from "@freon4dsl/core";
    import { componentId, RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { Event, SharedTask, Step, StudyConfiguration, TaskReference, UnscheduledEvent, type Task } from "@freon4dsl/study-configuration";
    import { onDestroy, onMount } from "svelte";
    import { expandCollapseStore } from "../../../services/stores/expand-collapse-store.js";
// ts-ignore
    import { ChevronDown as IconChevronDown, ChevronRight as IconChevronRight, Trash2 as IconDelete, Copy as IconDuplicate, EllipsisVertical as IconEllipsisVertical, Share2 as IconShare2 } from '@lucide/svelte';

    const LOGGER = new FreLogger("ItemGroupComponent");
    FreLogger.unmute("ItemGroupComponent");
    
    // const { box, editor } = $props<{ box: FragmentWrapperBox, editor: FreEditor }>();
    let { editor, box }: FreComponentProps<FragmentWrapperBox> = $props();
    let inputElement: HTMLInputElement;

    // Props - use $derived to properly react to box changes
    let cssClass = $derived(box?.findParam("cssClass") || "");
    let canDelete = $derived(box?.findParam("canDelete") === "true");
    let canCRUD = $derived(box?.findParam("canCRUD") === "true");
    let canDuplicate = $derived(box?.findParam("canDuplicate") === "true");
    let canShare = $derived(box?.findParam("canShare") === "true");
    let canExpandParam = $derived(box?.findParam("canExpand") === "true");
    /** When set to a StudyConfiguration flag name (e.g. 'showSteps'), component renders only when that flag is true. */
    let showWhen = $derived(box?.findParam("showWhen") || "");

    // Visibility by study configuration: if showWhen is set, show only when that flag is true
    let visibleByStudyConfig = $derived(() => {
        if (!showWhen || !box?.node) return true;
        const studyConfig = ownerOfType(box.node, "StudyConfiguration") as StudyConfiguration | null;
        if (!studyConfig) return true;
        const value = (studyConfig as unknown as Record<string, unknown>)[showWhen];
        return value === true;
    });

    // Store the language-defined default so we can restore it later
    let defaultIsExpanded = $derived(box?.findParam("isExpanded") === "true");
    let isExpanded = $state(false);
    // Content display value - directly controlled $state for reliable reactivity
    let contentDisplay = $state('none');
    
    // Initialize isExpanded and contentDisplay from defaultIsExpanded
    $effect(() => {
        if (defaultIsExpanded !== undefined) {
            isExpanded = defaultIsExpanded;
            contentDisplay = defaultIsExpanded ? 'block' : 'none';
        }
    });
    
    // Determine if the node has children that are being displayed
    // This is based on the display options in StudyConfiguration, not on actual children
    let hasDisplayedChildren = $derived(() => {
        if (!box || !box.node) return false;
        const node = box.node;
        
        // Get the StudyConfiguration to check display settings
        const studyConfig = ownerOfType(node, "StudyConfiguration") as StudyConfiguration | null;
        if (!studyConfig) return true; // Default to true if we can't find config
        
        // Check if it's a Task (or SharedTask) - show expand if showSteps is enabled
        if ('steps' in node && Array.isArray((node as any).steps)) {
            return studyConfig.showSteps;
        }
        
        // Check if it's a Step - show expand if any of references/systems/people are displayed
        if (node instanceof Step) {
            return studyConfig.showReferences || studyConfig.showSystems || studyConfig.showPeople;
        }
        
        // For other types, default to true if canExpand is set
        return true;
    });
    
    // Only show expand/collapse if both canExpand param is true AND children are being displayed
    let canExpand = $derived(() => canExpandParam && hasDisplayedChildren());
    let label = $derived(box?.findParam("label") || "");
    let nameBox: TextBox | undefined = $state()
    let otherChildren: Box[] | undefined = $state()

    let id = $derived(box ? componentId(box) : 'group-for-unknown-box');
    let contentElement: HTMLDivElement | undefined = $state();
    let cssContainerClass = "h-20"

    // The following three functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    async function setFocus(): Promise<void> {
        // console.log("setFocus nameBox: ", nameBox);
        nameBox?.setFocus();
    }

    const refresh = (why?: string): void => {
        // console.log("REFRESH (" + why + ")");
        // Check if childBox and refreshComponent exist before calling
        // This prevents errors when the component has been orphaned during study switch
        if (box?.childBox?.refreshComponent) {
            box.childBox.refreshComponent(why);
        }
        box.refreshComponent = refresh;
        
        // Update error state for nameBox validation
        updateNameBoxError();
    };
    
    // Check if nameBox is empty and set error state accordingly
    function updateNameBoxError(): void {
        if (nameBox) {
            const text = nameBox.getText()?.trim();
            const shouldHaveError = !text;
            // Only update if the error state actually changed to avoid infinite loops
            if (nameBox.hasError !== shouldHaveError) {
                nameBox.hasError = shouldHaveError;
            }
        }
    }

    onMount(() => {
        box.refreshComponent = refresh;   
        box.setFocus = setFocus;
    });

    // Subscribe to expand/collapse all commands
    // Use traditional store subscription with direct DOM manipulation as fallback
    const unsubscribe = expandCollapseStore.subscribe((cmd) => {
        if (cmd && canExpandParam) {
            let newExpandedState = isExpanded;
            if (cmd.command === 'expand') {
                newExpandedState = true;
            } else if (cmd.command === 'collapse') {
                newExpandedState = false;
            } else if (cmd.command === 'default') {
                // Restore to the language-defined default state
                newExpandedState = defaultIsExpanded;
            }
            // Update Svelte state
            isExpanded = newExpandedState;
            box.isExpanded = newExpandedState;
            contentDisplay = newExpandedState ? 'block' : 'none';
            
            // Direct DOM manipulation as fallback since Svelte 5 reactivity isn't working from store callbacks
            if (contentElement) {
                contentElement.style.display = newExpandedState ? 'block' : 'none';
            }
        }
    });

    onDestroy(() => {
        unsubscribe();
    });

    $effect(() => {
        box.refreshComponent = refresh;
        const fragmentBox = box.childBox as FragmentBox;
        const verticalLayoutBox = fragmentBox.childBox as VerticalLayoutBox;
        const children = verticalLayoutBox.children;
        otherChildren = children.slice(1);
        nameBox = children[0] as TextBox;
        
        // Set initial error state for nameBox
        updateNameBoxError();
        
        // Wrap nameBox's refreshComponent to also validate on text changes
        if (nameBox) {
            const originalRefresh = nameBox.refreshComponent;
            nameBox.refreshComponent = (why?: string) => {
                originalRefresh?.(why);
                updateNameBoxError();
            };
        }
    })

    const toggleExpanded = (event: MouseEvent | KeyboardEvent) => {
        isExpanded = !isExpanded;
        box.isExpanded = isExpanded;
        contentDisplay = isExpanded ? 'block' : 'none';
        event.stopPropagation();
        event.preventDefault();
    };

    const deleteItem = (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
        }
        AST.change(() => {
            // console.log("deleteItem box: ", box);
            // console.log("deleteItem box.node: ", box.node);
            const ownerDescriptor = box.node.freOwnerDescriptor();
            const parent = ownerDescriptor.owner;
            const propertyName = ownerDescriptor.propertyName;
            const index = ownerDescriptor.propertyIndex;

            if (parent && propertyName && typeof index === "number" && index >= 0) {
                parent[propertyName].splice(index, 1);
                LOGGER.log(`Removed item at index ${index} from ${propertyName}`);
            } else {
                LOGGER.log("Could not determine parent, property name, or index for deletion");
            }
        });
    }

    function smartDuplicate(originalElement: any, duplicatedElement: any) {
        const methodName = "smartUpdate";
        const args = [originalElement, duplicatedElement];
        // Call methodName if it exists on the element
        if (methodName in duplicatedElement && typeof (duplicatedElement as any)[methodName] === "function") {
            console.log(`smartDuplicate: Calling ${methodName} on the instance.`);
            return (duplicatedElement as any)[methodName](...args);
        } else {
            console.log(`Method ${methodName} does not exist on the instance.`);
        }
    }

    const duplicateItem = (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
        }
        AST.change(() => {
            const currentElement = box.node;

            const ownerDescriptor = currentElement.freOwnerDescriptor();
            const parent = ownerDescriptor.owner;
            const propertyName = ownerDescriptor.propertyName;
            const index = ownerDescriptor.propertyIndex;

            if (!parent || !propertyName || typeof index !== "number") {
                LOGGER.log("Could not determine parent, property name, or index for duplication");
                return;
            }

            const newElement = currentElement.copy();
            smartDuplicate(currentElement, newElement);
            parent[propertyName].splice(index + 1, 0, newElement);
            LOGGER.log("custom action duplicate, splicing in at index: " + (index + 1));
        });
    }

    const shareItem = (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
        }
        // Get the study config context
        const task = box.node as Task;
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

    // function duplicateItem(originalElement: FreNode, duplicatedElement: FreNode) {
    //     const event: Event = box.node as Event
    //         const period: Period = ownerOfType(event, "Period") as Period 
    //         const copyOfEvent = event.copy();
    //         extension(ExtendedEvent, Event);
    //         smartDuplicate(event, copyOfEvent);
    //         const index = period.events.indexOf(event);
    //         console.log("custom action duplicate, splicing in copyOfEvent: " + copyOfEvent.name + " at index: " + index)
    //         period.events.splice(index + 1, 0, copyOfEvent)
    // }

</script>

{#if visibleByStudyConfig()}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="{id}" class="item-group {cssClass}">
    {#if canExpand()}
        <button class="btn-icon p-0 ml-1 mr-1 toggle-button" onclick={toggleExpanded} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), toggleExpanded(e))} title={isExpanded ? "Collapse" : "Expand"} tabindex="0">
            {#if isExpanded}
                <IconChevronDown size={16} />
            {:else}
                <IconChevronRight size={16} />
            {/if}
        </button>
    {:else if !canExpandParam}
        <span class="w-5"></span>
    {/if}
    <span class="item-group-label" tabindex="-1">{label} </span>
    <RenderComponent box={nameBox} editor={editor} />
    {#if canDuplicate}
        <button class="circle-button action-button borderless" onclick={duplicateItem} onkeydown={(e) => e.key === 'Enter' && duplicateItem(e)} title="Duplicate" tabindex="0">
            <IconDuplicate size={14} />
        </button>
    {/if}
    {#if canDelete}
        <button class="circle-button action-button borderless" onclick={deleteItem} onkeydown={(e) => e.key === 'Enter' && deleteItem(e)} title="Delete" tabindex="0">
            <IconDelete size={14} />
        </button>
    {/if}
    {#if canShare}
        <button class="circle-button action-button borderless" onclick={shareItem} onkeydown={(e) => e.key === 'Enter' && shareItem(e)} title="Share" tabindex="0">
            <IconShare2 size={14} />
        </button>
    {/if}
    {#if canCRUD}
        <button class="circle-button action-button borderless" title="More..." tabindex="0">
            <IconEllipsisVertical size={14} />
        </button> 
    {/if}
</div>
<div class="list-group-content {cssClass} {canExpandParam && !hasDisplayedChildren() ? 'no-expand-indent' : ''}" bind:this={contentElement} style:display={contentDisplay}>
    {#each otherChildren as child}
        <RenderComponent box={child} editor={editor} />
    {/each}
</div>
{/if}
