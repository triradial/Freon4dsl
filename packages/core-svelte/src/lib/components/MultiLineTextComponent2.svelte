<script lang="ts">
    import { componentId } from "./svelte-utils/index.js";
    import { MultiLineTextBox2 } from "@freon4dsl/core";
    import type { FreComponentProps } from './svelte-utils/FreComponentProps.js';
    import { onMount, onDestroy } from "svelte";

    // Props
    let { box, editor }: FreComponentProps<MultiLineTextBox2> = $props();

    // Local state
    let id: string = $state('');
    id = !!box ? componentId(box) : "text-with-unknown-box";
    const placeholderStore = $derived(() => box.placeHolder);
    let text: string = $state('');
    let cssClass: string = "";
    let editorDiv: HTMLDivElement | null = null;
    let quill: any = null;
    let isEditing = false;
    let quillInitialized = false;
    let html = "";

    // // TinyMCE config
    // let conf = {
    //     plugins: "lists searchreplace",
    //     toolbar: "undo redo | bold italic underline | fontfamily fontsize | forecolor backcolor | alignleft aligncenter alignright | bullist numlist outdent indent | searchreplace",
    //     toolbar_mode: "wrap",
    //     skin: "oxide-dark",
    //     menubar: false,
    // };

    $effect(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    export async function setFocus(): Promise<void> {
        // The Editor component does not expose a direct focus method.
        // Optionally, you could use a ref and call .focus() on the underlying element if needed.
    }

    function onEditorBlur(event: CustomEvent) {
        if (text !== box.getText()) {
            box.setText(text);
        }
    }

    const refresh = () => {
        text = box.getText();
        cssClass = box.cssClass;
    };

    refresh();

    // Only initialize Quill when isEditing and editorDiv are set
    $effect(() => {
        if (isEditing && editorDiv && !quillInitialized) {
            import("quill").then(({ default: Quill }) => {
                if (editorDiv) {
                    quill = new Quill(editorDiv, {
                        theme: "snow",
                        placeholder: box.placeHolder || "<enter>",
                        modules: {
                            toolbar: [
                                [{ 'undo': 'undo' }, { 'redo': 'redo' }],
                                ['bold', 'italic', 'underline'],
                                [{ 'font': [] }, { 'size': [] }],
                                [{ 'color': [] }, { 'background': [] }],
                                [{ 'align': [] }],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
                                ['clean']
                            ]
                        }
                    });
                    const toolbar = quill.getModule('toolbar');
                    if (toolbar) {
                        toolbar.addHandler('undo', () => quill.history.undo());
                        toolbar.addHandler('redo', () => quill.history.redo());
                    }
                    quill.on("text-change", () => {
                        html = editorDiv?.querySelector?.(".ql-editor")?.innerHTML ?? "";
                    });
                    // Set initial content if html is not empty
                    if (html) {
                        quill.root.innerHTML = html;
                    }
                    quillInitialized = true;
                }
            });
        }
    });

    // Clean up Quill when not editing
    $effect(() => {
        if (!isEditing && quillInitialized) {
            quill = null;
            quillInitialized = false;
        }
    });

    onMount(async () => {
        // Optionally import Quill modules for font, size, color, etc.
        // You may need to import/register additional modules for full toolbar support
    });

    onDestroy(() => {
        quill = null;
        quillInitialized = false;
    });
</script>

{#if isEditing}
    <div class="multiline-container">
        <div bind:this={editorDiv}></div>
        <button onclick={() => isEditing = false}>Done</button>
    </div>
{:else}
    <div class="multiline-html" onclick={() => isEditing = true} tabindex="0" style="cursor: pointer;">
        {#if html}
            {@html html}
        {:else}
            <span class="placeholder">{box.placeHolder || "<enter>"}</span>
        {/if}
    </div>
{/if}

<!--
Associated commands:

npm install quill

// In your main entry or global style:
import "quill/dist/quill.snow.css";

// If you want to support font family, size, color, etc., you may need to import/register Quill formats:
// import Quill from 'quill';
// import 'quill/dist/quill.snow.css';
// Quill.register('formats/font', ...);
// Quill.register('formats/size', ...);
// Quill.register('formats/color', ...);
// See Quill documentation for details.

// For search/replace, see Quill community plugins or implement a custom module.
-->
