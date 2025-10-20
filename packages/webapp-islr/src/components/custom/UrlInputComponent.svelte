<script lang="ts">
    import { StringReplacerBox } from "@freon4dsl/core";
    import LinkSimple from "phosphor-svelte/lib/LinkSimple";
    import { onMount } from "svelte";

    const { box } = $props<{ box: StringReplacerBox }>();
    // Stabilize prop reference for event handlers
    let theBox: StringReplacerBox | null = null;
    let value = $state("");
    let inputElement: HTMLInputElement | null = null;
    let isTouched = $state(false);

    function isValidUrl(str: string): boolean {
        try {
            const url = new URL(str);
            const isValid = url.protocol === "http:" || url.protocol === "https:";
            console.log("[UrlInput] isValidUrl:", isValid, "for:", str);
            return isValid;
        } catch (_) {
            console.log("[UrlInput] isValidUrl: false (parse error) for:", str);
            return false;
        }
    }

    function getValue() {
        const startStr: string | undefined = theBox?.getPropertyValue();
        if (typeof startStr === "string") {
            value = startStr;
        } else {
            value = "";
        }
        return value;
    }

    function setFocus() {
        setTimeout(() => {
            const el: any = inputElement;
            if (el && typeof el.focus === "function") {
                el.focus();
                el.select?.();
            }
        }, 0);
    }


    const refresh = (why?: string): void => {
        getValue();
    };

    onMount(() => {
        theBox = box as unknown as StringReplacerBox;
        getValue();
        if (theBox) {
            theBox.setFocus = setFocus;
            theBox.refreshComponent = refresh;
        }
    });

    $effect(() => {
        if (!theBox) {
            theBox = box as unknown as StringReplacerBox;
        }
        if (theBox) {
            theBox.setFocus = setFocus;
            theBox.refreshComponent = refresh;
        }
    });

    function onInputChange(e: Event) {
        const newVal = (e.target as HTMLInputElement).value;
        value = newVal; // allow free typing, no normalization during input
        const setter: any = theBox as any;
        if (setter && typeof setter.setPropertyValue === "function") {
            setter.setPropertyValue(newVal);
        }
        console.log("[UrlInput] onInputChange value:", newVal);
        if (isTouched && isValidUrl(newVal.trim())) {
            isTouched = false; // clear error when valid again
        }
    }

    function onKeyDown(event: KeyboardEvent) {
        if (
            event.key === "Backspace" ||
            event.key === "Delete" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            event.key === "Home" ||
            event.key === "End" ||
            // printable characters
            event.key.length === 1
        ) {
            event.stopPropagation();
        }
    }

    let showError = $state(false);
    
    $effect(() => {
        const trimmed = value.trim();
        const next = isTouched && trimmed.length > 0 && !isValidUrl(trimmed);
        if (showError !== next) {
            showError = next;
        }
        console.log("[UrlInput] showError computed:", showError, "touched:", isTouched, "value:", trimmed);
    });

</script>

<span class="inline-flex flex-col align-middle w-full">
    <span class="relative inline-block">
        <input
            bind:this={inputElement}
            class="text-component-input pr-8 w-full"
            type="url"
            placeholder="https://example.com"
            bind:value={value}
            oninput={onInputChange}
            onkeydown={onKeyDown}
            onpaste={(e) => {
                // let the paste update input value, then sync/validate
                setTimeout(() => {
                    const el = e.target as HTMLInputElement;
                    value = el.value.trim();
                    const setter: any = theBox as any;
                    if (setter && typeof setter.setPropertyValue === "function") {
                        setter.setPropertyValue(value);
                    }
                    // normalize DOM after paste
                    if (inputElement) {
                        inputElement.value = value;
                    }
                    // sync from model
                    const persisted = theBox?.getPropertyValue();
                    if (typeof persisted === "string") {
                        value = persisted.trim();
                        if (inputElement) inputElement.value = value;
                    }
                    console.log("[UrlInput] onPaste value:", value);
                }, 0);
            }}
            onblur={() => {
                // normalize and revalidate on blur
                if (inputElement) {
                    value = inputElement.value.trim();
                    const setter: any = theBox as any;
                    if (setter && typeof setter.setPropertyValue === "function") {
                        setter.setPropertyValue(value);
                    }
                    console.log("[UrlInput] onBlur value:", value);
                }
                // show error only if invalid after blur
                isTouched = !isValidUrl(value);
            }}
        />
        <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 z-10" style="color: var(--green-90t);">
            <LinkSimple class="w-4 h-4" />
        </span>
    </span>
    {#if showError}
        <span class="small-label-text mt-1 self-start" style="color:#ef4444">Enter a valid URL (http/https).</span>
    {/if}
</span>


