<script lang="ts">
    import { onMount } from "svelte";
    import { TimeField } from "bits-ui";
    import { ExternalStringBox } from "@freon4dsl/core";

    const { box } = $props<{ box: ExternalStringBox }>();
    let value = $state("");
    let isOpen = $state(false);
    let triggerElement: HTMLButtonElement | null = null;

    function getValue() {
        let startStr: string | undefined = box.getPropertyValue();
        if (typeof startStr === "string" && !!startStr && startStr.length > 0) {
            value = startStr;
        } else {
            value = "";
        }
        return value;
    }

    function setFocus() {
        isOpen = true;
        setTimeout(() => {
            if (triggerElement) triggerElement.focus();
        }, 0);
    }
    const refresh = (why?: string): void => {
        getValue();
    };

    onMount(() => {
        getValue();
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });
    $effect(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    function onValueChange(newValue: string) {
        value = newValue;
        box.setPropertyValue(newValue);
    }
</script>

<TimeField.Root value={value} on:valueChange={e => onValueChange(e.detail)}>
    <div class="flex w-full max-w-[232px] flex-col gap-1.5">
        <TimeField.Label class="block select-none text-sm font-medium">Time</TimeField.Label>
        <TimeField.Input class="h-input rounded-input border-border-input bg-background text-foreground focus-within:border-border-input-hover focus-within:shadow-date-field-focus hover:border-border-input-hover flex w-full max-w-[232px] select-none items-center border px-2 py-3 text-sm tracking-[0.01em]">
            {#snippet children({ segments })}
                {#each segments as { part, value }, i (part + i)}
                    <div class="inline-block select-none">
                        {#if part === "literal"}
                            <TimeField.Segment {part} class="text-muted-foreground p-1">{value}</TimeField.Segment>
                        {:else}
                            <TimeField.Segment {part} class="rounded-5px hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1">{value}</TimeField.Segment>
                        {/if}
                    </div>
                {/each}
            {/snippet}
        </TimeField.Input>
    </div>
</TimeField.Root>
