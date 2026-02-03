<script lang="ts">
    import { AST, Box, FragmentBox, FragmentWrapperBox, FreLogger, FreNodeReference, ownerOfType, ReferenceBox, VerticalLayoutBox } from "@freon4dsl/core";
    import { componentId, RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { Event, SharedTask, TaskReference, type StudyConfiguration, type Task } from "@freon4dsl/study-configuration";
    import { onMount } from "svelte";
// ts-ignore
    import { ChevronDown as IconChevronDown, ChevronRight as IconChevronRight, Trash2 as IconDelete, Copy as IconDuplicate, EllipsisVertical as IconEllipsisVertical, Share2 as IconShare2 } from '@lucide/svelte';

    const LOGGER = new FreLogger("ItemGroupComponent");
    FreLogger.unmute("ItemGroupComponent");
    
    // const { box, editor } = $props<{ box: FragmentWrapperBox, editor: FreEditor }>();
    let { editor, box }: FreComponentProps<FragmentWrapperBox> = $props();
    let inputElement: HTMLInputElement;

    // Props
    let cssClass = box && box.findParam("cssClass") || "";
    let canDelete = box && box.findParam("canDelete") === "true";
    let canCRUD = box && box.findParam("canCRUD") === "true";
    let canDuplicate = box && box.findParam("canDuplicate") === "true";
    let canShare = box && box.findParam("canShare") === "true";
    let canExpand = box && box.findParam("canExpand") === "true";
    let hideDragHandle = box && box.findParam("hideDragHandle") === "true";
    
    // Set hideDragHandle on the box so ListComponent can check it
    if (box && hideDragHandle) {
        box.hideDragHandle = true;
    }
    let isExpanded = $state(box && box.findParam("isExpanded") === "true");
    let label = $derived(() => box ? box.findParam("label") || "" : "");
    let referenceBox: ReferenceBox | undefined = $state()
    let otherChildren: Box[] | undefined = $state()

    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    let contentElement: HTMLDivElement | undefined = $state();
    let contentStyle = $derived(() => isExpanded ? 'display:block;' : 'display:none;');
    let cssContainerClass = "h-20"

    // The following three functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    async function setFocus(): Promise<void> {
        // console.log("setFocus nameBox: ", nameBox);
        referenceBox?.setFocus();
    }

    const refresh = (why?: string): void => {
        // console.log("REFRESH (" + why + ")");
        box.childBox.refreshComponent(why);
        box.refreshComponent = refresh;
    };

    onMount(() => {
        box.refreshComponent = refresh;   
        box.setFocus = setFocus;
    });

    $effect(() => {
        box.refreshComponent = refresh;
        const fragmentBox = box.childBox as FragmentBox;
        if (fragmentBox.childBox.kind === "VerticalLayoutBox") {
            const verticalLayoutBox = fragmentBox.childBox as VerticalLayoutBox;
            const children = verticalLayoutBox.children;
            otherChildren = children.slice(1);
            referenceBox = children[0] as ReferenceBox;
        } else {
            referenceBox = fragmentBox.childBox as ReferenceBox;
        }
    })

    const toggleExpanded = (event: MouseEvent | KeyboardEvent) => {
        isExpanded = !isExpanded;
        box.isExpanded = isExpanded;
        event.stopPropagation();
        event.preventDefault();
    };

    const deleteItem = (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
        }
        AST.change(() => {
            const ownerDescriptor = box.node.freOwnerDescriptor();
            const parent = ownerDescriptor.owner;
            const propertyName = ownerDescriptor.propertyName;
            const index = ownerDescriptor.propertyIndex;

            if (parent && propertyName && typeof index === "number" && index >= 0) {
                parent[propertyName].splice(index, 1);
            } else {
                LOGGER.log("Could not determine parent, property name, or index for deletion");
            }
        });
    }

    const duplicateItem = (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
        }
        // AST.change(() => {
        //     const propertyName = box.propertyName;
        //     const currentElement = box.node;
        //     const typeName = currentElement.freLanguageConcept();

        //     const ownerDescriptor = box.node.freOwnerDescriptor();
        //     const parent = ownerDescriptor.owner;
        //     const propertyName = ownerDescriptor.propertyName;
        //     const index = ownerDescriptor.propertyIndex;

        //     const property = FreLanguage.getInstance().classifierProperty(typeName, propertyName);
        //     if (property.type) {
        //         let newConceptName = property.type;
        //         if (newConceptName.startsWith('Abstract')) {
        //             newConceptName = newConceptName.slice(8);
        //         }
        //         const newElement = FreLanguage.getInstance().createConceptOrUnit(newConceptName);
        //         smartDuplicate(currentElement, newElement);
        //         const currentIndex = box.getPropertyValue().indexOf(currentElement); 
        //         box.getPropertyValue().splice(currentIndex + 1, 0, newElement);
        //         LOGGER.log("custom action duplicate, splicing in copyOfEvent: " + newElement.name + " at index: " + currentIndex);
        //     } else {
        //         LOGGER.log("No property type");
        //     }
        // });
    }

    const shareItem = (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
        }
        // LOGGER.log("Sharing item")
        // console.log("Sharing ItemGroupComponent2: box.node", box.node)
        // Get the study config context
        const task = box.node as Task
        const studyConfig: StudyConfiguration = ownerOfType(task, "StudyConfiguration") as StudyConfiguration
        const eventObj: Event = ownerOfType(task, "Event") as unknown as Event
        AST.change(() => {
            // Create the shard task and wire together
            let newSharedTask = SharedTask.create({
                name: task.name,
                description: task.description,
                numberedSteps: task.numberedSteps,
                showDetails: task.showDetails,
                steps: task.steps.map((step) => step.copy()),
            })
            let refToTask = FreNodeReference.create(task.name, "SharedTask") as FreNodeReference<SharedTask>
            refToTask.referred = newSharedTask
            let newTaskReference = TaskReference.create({
                task: refToTask
            })
            // Replace the original task in the event with the new task reference
            eventObj.tasks[eventObj.tasks.indexOf(task)] = newTaskReference
            // Add the new shared task to the shared tasks list
            studyConfig.tasks.push(newSharedTask)
        })
    }

    // function smartDuplicate(originalElement: any, duplicatedElement: any) {
    //     const methodName = "smartUpdate";
    //     const args = [originalElement, duplicatedElement];
    //     // Call methodName if it exists on the element
    //     if (methodName in duplicatedElement && typeof (duplicatedElement as any)[methodName] === "function") {
    //         console.log(`smartDuplicate: Calling ${methodName} on the instance.`);
    //         return (duplicatedElement as any)[methodName](...args);
    //     } else {
    //         console.log(`Method ${methodName} does not exist on the instance.`);
    //     }
    // }

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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="{id}" class="item-group {cssClass}">
    {#if canExpand}
        <button class="btn-icon p-0 ml-1 mr-1 toggle-button" onclick={toggleExpanded} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), toggleExpanded(e))} title={isExpanded ? "Collapse" : "Expand"} tabindex="0">
            {#if isExpanded}
                <IconChevronDown size={16} />
            {:else}
                <IconChevronRight size={16} />
            {/if}
        </button>
    {:else}
        <span class="w-5"></span>   
    {/if}
    <span class="item-group-label" tabindex="-1">{label()}:</span>
    <RenderComponent box={referenceBox} editor={editor} />
    {#if canDuplicate}
        <button class="circle-button action-button" onclick={duplicateItem} onkeydown={(e) => e.key === 'Enter' && duplicateItem(e)} title="Duplicate" tabindex="0">
            <IconDuplicate size={14} />
        </button>
    {/if}
    {#if canDelete}
        <button class="circle-button action-button" onclick={deleteItem} onkeydown={(e) => e.key === 'Enter' && deleteItem(e)} title="Delete" tabindex="0">
            <IconDelete size={14} />
        </button>
    {/if}
    {#if canShare}
        <button class="circle-button action-button" onclick={shareItem} onkeydown={(e) => e.key === 'Enter' && shareItem(e)} title="Share" tabindex="0">
            <IconShare2 size={14} />
        </button>
    {/if}
    {#if canCRUD}
        <button class="circle-button action-button" title="More..." tabindex="0">
            <IconEllipsisVertical size={14} />
        </button> 
    {/if}
</div>
{#if otherChildren}
    {#key contentStyle}
        <div class="list-group-content {cssClass}" bind:this={contentElement} style={contentStyle()}>
            {#each otherChildren as child}
                <RenderComponent box={child} editor={editor} />
            {/each}
        </div>
    {/key}
{/if}
