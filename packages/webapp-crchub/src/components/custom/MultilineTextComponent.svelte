<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { AST, PartWrapperBox, FreEditor, FreLogger } from "@freon4dsl/core";
    import { componentId } from "@freon4dsl/core-svelte";

    const LOGGER = new FreLogger("ItemGroupComponent");

    const { box, editor } = $props<{ box: PartWrapperBox, editor: FreEditor }>();
    
    let cssClass = box && box.findParam("cssClass") || "";

    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    let placeholder = $derived(() => box ? box.findParam("placeholder") || "" : "");

    let isEditing = $state(false);
    let spanRef = $state<HTMLSpanElement | null>(null);
    let editorInstance: any = null;

    const getText = () => {
        const propertyName = "name";
        const node = box.node;
        return node[propertyName];
    }

    const setText = (value: string) => {
        //TODO: This is not being picked up by the undo/redo mechanism

        AST.change(() => {
            const propertyName = "description";
            const node = box.node;
            const oldValue = node[propertyName];
            console.debug(`[MultilineTextComponent] Changing property '${propertyName}' of node`, node, 'from', oldValue, 'to', value);
            node[propertyName] = value;
        });
    };

    let text = $state(getText());

    // Expose setFocus and refreshComponent on the box
    function setFocus() {
        isEditing = true;
        setTimeout(() => {
            if (editorInstance) editorInstance.focus();
        }, 0);
    }

    const refresh = (why?: string): void => {
        LOGGER.log("REFRESH (" + why + ")");
    };

    onMount(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    $effect(() => {
        text = getText();
    });

    function startEditing(event?: MouseEvent | KeyboardEvent) {
        isEditing = true;
        event?.preventDefault?.();
        event?.stopPropagation?.();
        setTimeout(() => {
            if (editorInstance) editorInstance.focus();
        }, 0);
    }

    function endEditing() {
        isEditing = false;
        if (text !== box.getText?.()) {
            box.setText?.(text);
        }
    }

    function onSpanKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            startEditing(event);
        }
    }

    // TinyMCE setup/teardown
    // $effect(() => {
    //     if (isEditing) {
    //         // @ts-ignore
    //         if (window.tinymce) {
    //             window.tinymce.init({
    //                 selector: `#${editorDivId}`,
    //                 plugins: "lists searchreplace",
    //                 toolbar: "undo redo | bold italic underline | fontfamily fontsize | forecolor backcolor | alignleft aligncenter alignright | bullist numlist outdent indent | searchreplace",
    //                 toolbar_mode: "floating",
    //                 menubar: false,
    //                 skin: "oxide-dark",
    //                 inline: true,
    //                 license_key: "gpl",
    //                 setup: (editor) => {
    //                     editorInstance = editor;
    //                     editor.on("change keyup", () => {
    //                         text = editor.getContent();
    //                     });
    //                     editor.on("blur", () => {
    //                         endEditing();
    //                     });
    //                 },
    //                 init_instance_callback: (editor) => {
    //                     editor.setContent(text || "");
    //                 }
    //             });
    //         }
    //     } else {
    //         if (window.tinymce && window.tinymce.get(editorDivId)) {
    //             window.tinymce.get(editorDivId).remove();
    //             editorInstance = null;
    //         }
    //     }
    // });

    onDestroy(() => {
        // if (window.tinymce && window.tinymce.get(editorDivId)) {
        //     window.tinymce.get(editorDivId).remove();
        // }
    });
</script>

<div class={`multiline2-component ${cssClass} w-full`}>
    {#if isEditing}
        <div class="multiline2-editor edit-mode w-full">
            <div id="{id}-tinymce"></div>
        </div>
    {:else}
        <span
            id={id + "-span"}
            class={`multiline2-text view-mode ${box.role || ''} text-box-text`}
            bind:this={spanRef}
            tabindex="0"
            onclick={startEditing}
            onkeydown={onSpanKeydown}
            role="button"
            style="cursor: pointer;"
        >
            {#if !!text && text.length > 0}
                {@html text}
            {:else}
                <span class="text-component-placeholder">{placeholder}</span>
            {/if}
        </span>
    {/if}
</div>

