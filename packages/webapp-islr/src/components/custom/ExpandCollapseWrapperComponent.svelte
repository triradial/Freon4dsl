<script lang="ts">
    import { onMount } from "svelte";
    import { FreEditor, FreUtils, PartWrapperBox } from "@freon4dsl/core";
    import { RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    
    const { editor, box }: FreComponentProps<PartWrapperBox> = $props();

    // let inputElement: any;
    let msg: string;

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    async function setFocus(): Promise<void> {
        // inputElement.focus();
    }
    const refresh = (why?: string): void => {
        // do whatever needs to be done to refresh the elements that show information from the model
    };

    $effect(() => {
        // // console.log("[ExpandCollapseWrapperComponent] $effect box.children:", box?.children);
        // msg = "Expand/Collapse Wrapper children:";
        // if (box?.children && Array.isArray(box.children)) {
        //     let verticalBox = box.children[0];
        //     msg +=
        //         "<br>  First Box children:" +
        //         verticalBox.kind +
        //         " cssClass: " +
        //         verticalBox.cssClass +
        //         " concept: " +
        //         verticalBox.node.freLanguageConcept() +
        //         "<br>   ";
        //     const verticalBoxChildren = verticalBox.children[0];
        //     msg +=
        //         "<br>  Second Box children:" + verticalBoxChildren.kind + " concept: " + verticalBoxChildren.node.freLanguageConcept() + " Children: <br>   ";
        //     verticalBoxChildren.children.forEach((childBox: any) => {
        //         const childName = childBox.kind ?? "Unnamed";
        //         msg += "<br>  " + childName;
        //     });
        // } else {
        //     msg += " No children or invalid children property";
        // }
    });

    onMount(() => {
        let verticalBox = box.childBox.children[0];
        const extendedCssClass = verticalBox.cssClass;
        FreUtils.initializeObject(verticalBox, { selectable: false, cssClass: extendedCssClass });
        verticalBox.children.forEach((childBox: any) => {
            let childExtendedCssClass = verticalBox.cssClass + " align-top";
            FreUtils.initializeObject(childBox, { selectable: true, cssClass: childExtendedCssClass });
        });
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
        // console.log("[ExpandCollapseWrapperComponent] onMount verticalBox:", verticalBox);
    });

    $effect(() => {
        // console.log("[ExpandCollapseWrapperComponent] $effect setFocus/refresh assignment");
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });
</script>

<div class="wrapper">
    <!-- <div>msg: {@html msg}</div> -->
    <RenderComponent box={box.childBox} {editor} cssClass="w-full" />
</div>
