<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { AST, type StringWrapperBox, FreEditor, FreLogger } from "@freon4dsl/core";
    import { componentId, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { theme } from "../../../services/stores/theme-store.js";

    interface Window {
        tinymce: any;
    }

    const LOGGER = new FreLogger("MultilineTextComponent");
    FreLogger.unmute("MultilineTextComponent");

    const { editor, box }: FreComponentProps<StringWrapperBox> = $props();
    
    // Props - use $derived to properly react to box changes
    let cssClass = $derived(box?.findParam("cssClass") || "");
    let textPropertyName = $derived(box?.findParam("textPropertyName") || "text");
    let rawTextPropertyName = $derived(box?.findParam("rawTextPropertyName") || "rawText");

    let id = $derived(box ? componentId(box) : 'group-for-unknown-box');
    let placeholder = $derived(box?.findParam("placeholder") || "<description>");

    let isEditing = $state(false);
    let spanRef = $state<HTMLSpanElement | null>(null);
    let editorInstance: any = null;
    
    let currentTheme = $theme;
    let isProgrammaticUpdate = false;

    let conf = {
        plugins: "lists searchreplace",
        // Use array format for multiple toolbar rows
        toolbar: [
            "undo redo | bold italic underline | fontfamily fontsize",
            "forecolor backcolor | alignleft aligncenter alignright | bullist numlist outdent indent | searchreplace"
        ],
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
        // If already editing, focus the TinyMCE editor
        if (isEditing && editorInstance) {
            setTimeout(() => {
                editorInstance.focus();
            }, 0);
        } else {
            // Otherwise, focus the span element (view mode)
            setTimeout(() => {
                if (spanRef) {
                    spanRef.focus();
                }
            }, 0);
        }
    }

    const refresh = (why?: string): void => {
        LOGGER.log("REFRESH (" + why + ")");
    };

    onMount(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    let editorDivId = $derived(`${id}-tinymce`);
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
            skin_url: isDark ? "/tinymce/skins/ui/oxide-dark" : "/tinymce/skins/ui/oxide",
            content_css: false, // Using content_style instead
            inline: true,
            license_key: "gpl",
            content_style: isDark
                ? "body { color: #fff; background: #22272e; }"
                : "body { color: #000; background: #cfd6e0; }",
            // Strip images, videos, and other embedded media from pasted HTML
            // so only formatted text is allowed
            paste_preprocess: (_plugin, args) => {
                const div = document.createElement("div");
                div.innerHTML = args.content;
                div.querySelectorAll("img, video, audio, canvas, object, embed, picture, source, svg")
                    .forEach((el) => el.remove());
                args.content = div.innerHTML;
            },
            setup: (editor) => {
                editorInstance = editor;
                // Key handling for TinyMCE editor
                editor.on("keydown", (e) => {
                    // Backspace/Delete: prevent bubbling (would delete the element in Freon)
                    if (e.key === "Backspace" || e.key === "Delete") {
                        e.stopPropagation();
                    }
                    
                    // Arrow keys: stay in TinyMCE for text navigation
                    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
                        e.stopPropagation();
                    }
                    
                    // Tab/Shift+Tab: stay in TinyMCE (for list indentation, etc.)
                    if (e.key === "Tab") {
                        e.stopPropagation();
                        // Don't preventDefault - let TinyMCE handle tab for indentation
                    }
                    
                    // Enter key: stay in TinyMCE for multiline editing
                    // Use Escape or click outside to exit editing mode
                    if (e.key === "Enter") {
                        e.stopPropagation();
                        // Let TinyMCE handle Enter normally (adds newline)
                    }

                    // Clipboard shortcuts (Ctrl/Cmd + C, V, X) and Select All (Ctrl/Cmd + A):
                    // Stop propagation so Freon does not intercept them
                    if ((e.ctrlKey || e.metaKey) && ["v", "c", "x", "a"].includes(e.key.toLowerCase())) {
                        e.stopPropagation();
                    }
                    
                    // Escape: exit editing mode
                    if (e.key === "Escape") {
                        e.stopPropagation();
                        e.preventDefault();
                        const val = editor.getContent();
                        const rawVal = editor.getContent({ format: "text" });
                        setText(val, rawVal);
                        endEditing();
                    }
                });

                // Also stop paste/copy/cut event propagation directly,
                // in case the parent framework listens on these DOM events.
                // For paste: also block clipboard-only image pastes (e.g. screenshots)
                // that contain no text/html content at all.
                editor.on("paste", (e) => {
                    e.stopPropagation();
                    const clipboardData = e.clipboardData || (window as any).clipboardData;
                    if (clipboardData) {
                        const hasText = clipboardData.types.includes("text/plain") ||
                                        clipboardData.types.includes("text/html");
                        const hasFiles = clipboardData.files && clipboardData.files.length > 0;
                        // If the paste is only image files with no textual content, block it
                        if (!hasText && hasFiles) {
                            e.preventDefault();
                        }
                    }
                });
                editor.on("copy", (e) => { e.stopPropagation(); });
                editor.on("cut", (e) => { e.stopPropagation(); });
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

    // Initialize TinyMCE when entering edit mode
    $effect(() => {
        if (isEditing) {
            // Small delay to ensure the DOM element is rendered
            setTimeout(() => {
                initTinyMCE();
            }, 0);
        }
    });

    // Re-initialize TinyMCE on theme change
    $effect(() => {
        currentTheme = $theme;
        if (isEditing && editorInstance) {
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

    function onSpanFocus() {
        LOGGER.log("MultilineTextComponent span received focus: " + id);
        console.log("MultilineTextComponent span received focus: " + id);
        // Automatically start editing when the span receives focus (e.g., via Tab)
        startEditing();
    }
</script>

<div class={`multiline2-component ${cssClass}`}>
    {#if isEditing}
        <div class="edit-mode">
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <!-- Pre-populate with text to avoid empty flash while TinyMCE initializes -->
            <div id={editorDivId} contenteditable="true">{@html text || ""}</div>
        </div>
    {:else}
        <span
            id={id + "-span"}
            class="view-mode mce-content-body"
            bind:this={spanRef}
            tabindex="0"
            onclick={startEditing}
            onkeydown={onSpanKeydown}
            onfocus={onSpanFocus}
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
