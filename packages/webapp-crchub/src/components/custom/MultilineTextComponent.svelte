<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { AST, PartWrapperBox, FreEditor, FreLogger } from "@freon4dsl/core";
    import { componentId, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { theme } from "../../services/stores/theme-store.js";

    interface Window {
        tinymce: any;
    }

    const LOGGER = new FreLogger("MultilineTextComponent");
    FreLogger.unmute("MultilineTextComponent");

    const { editor, box }: FreComponentProps<PartWrapperBox> = $props();
    
    let cssClass = box && box.findParam("cssClass") || "";
    let textPropertyName = box && box.findParam("textPropertyName") || "text";
    let rawTextPropertyName = box && box.findParam("rawTextPropertyName") || "rawText";

    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    let placeholder = $state(box ? box.findParam("placeholder") || "<description>" : "<description>");

    let isEditing = $state(false);
    let spanRef = $state<HTMLSpanElement | null>(null);
    let editorInstance: any = null;
    
    let currentTheme = $theme;
    let isProgrammaticUpdate = false;

    let conf = {
        plugins: "lists searchreplace",
        toolbar:
            "undo redo | bold italic underline \
		| fontfamily fontsize \
		| forecolor backcolor \
		| alignleft aligncenter alignright \
		| bullist numlist outdent indent | searchreplace",
        toolbar_mode: "wrap",
        skin: "oxide-dark",
        menubar: false,
    };

    const getText = () => {
        const node = box.node;
        return node[textPropertyName];
    }

    const setText = (value: string, rawValue: string) => {
        AST.change(() => {
            const node = box.node;
            const oldValue = node[textPropertyName];
            if (oldValue !== value) {
                LOGGER.log(`Changing property: '${textPropertyName}' of node: '${node}' from '${oldValue}' to '${value}'`);
                node[textPropertyName] = value;
                node[rawTextPropertyName] = rawValue;
                text = value; // update local state immediately
            }
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

    let editorDivId = `${id}-tinymce`;
    let tinymceScriptLoaded = false;

    // Helper to load TinyMCE script from local static folder if not already loaded
    function loadTinyMCEScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if ((window as any).tinymce) {
                tinymceScriptLoaded = true;
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = '/tinymce/tinymce.min.js';
            script.onload = () => {
                tinymceScriptLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    function getTinyMCEConfig() {
        const isDark = currentTheme === "dark";
        return {
            plugins: conf.plugins,
            toolbar: conf.toolbar,
            toolbar_mode: conf.toolbar_mode,
            menubar: conf.menubar,
            skin: isDark ? "oxide-dark" : "oxide",
            content_css: isDark ? "dark" : "default",
            inline: true,
            license_key: "gpl",
            content_style: isDark
                ? "body { color: #fff; background: #22272e; }"
                : "body { color: #000; background: #cfd6e0; }",
            setup: (editor) => {
                editorInstance = editor;
                // Prevent Backspace/Delete from bubbling
                editor.on("keydown", (e) => {
                    if (e.key === "Backspace" || e.key === "Delete") {
                        e.stopPropagation();
                    }
                });
                editor.on("blur", () => {
                    if (isProgrammaticUpdate) return;
                    const val = editor.getContent();
                    const rawVal = editor.getContent({ format: "text" });
                    setText(val, rawVal);
                    endEditing(); // Exit editing mode when TinyMCE loses focus
                });
            },
            init_instance_callback: (editor) => {
                editor.setContent(text || "");
                editor.focus(); // Focus immediately so toolbar appears
            }
        };
    }

    // Initialize TinyMCE in inline mode on the div
    async function initTinyMCE() {
        await loadTinyMCEScript();
        if ((window as any).tinymce && !(window as any).tinymce.get(editorDivId)) {
            (window as any).tinymce.init({
                selector: `#${editorDivId}`,
                ...getTinyMCEConfig(),
            });
        }
    }

    // Re-initialize TinyMCE on theme change
    $effect(() => {
        currentTheme = $theme;
        if (isEditing) {
            destroyTinyMCE();
            setTimeout(() => {
                initTinyMCE();
            }, 0);
        }
    });

    // Remove TinyMCE instance if exists
    function destroyTinyMCE() {
        if ((window as any).tinymce && (window as any).tinymce.get(editorDivId)) {
            (window as any).tinymce.get(editorDivId).remove();
            editorInstance = null;
        }
    }

    $effect(() => {
        const modelValue = getText();
        if (text !== modelValue) {
            text = modelValue;
            if (isEditing && editorInstance && editorInstance.getContent() !== modelValue) {
                isProgrammaticUpdate = true;
                editorInstance.setContent(modelValue || "");
                setTimeout(() => { isProgrammaticUpdate = false; }, 0);
            }
        }
    });

    onDestroy(() => {
        destroyTinyMCE();
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
        // if (text !== box.getText?.()) {
        //     box.setText?.(text);
        // }
    }

    function onSpanKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            startEditing(event);
        }
    }
</script>

<div class={`multiline2-component ${cssClass}`}>
    {#if isEditing}
        <div class="edit-mode">
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div id={editorDivId} contenteditable="true"></div>
        </div>
    {:else}
        <span
            id={id + "-span"}
            class="view-mode mce-content-body"
            bind:this={spanRef}
            tabindex="0"
            onclick={startEditing}
            onkeydown={onSpanKeydown}
            role="button"
            style="cursor: pointer;"
        >
            {#if !!text && text.trim().length > 0}
                {@html text}
            {:else}
                <span class="multiline2-component-placeholder">{placeholder}</span>
            {/if}
        </span>
    {/if}
</div>

