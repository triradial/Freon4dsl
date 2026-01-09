<script lang="ts">
    import { StringReplacerBox } from "@freon4dsl/core";
    import Phone from "phosphor-svelte/lib/Phone";
    import { onMount } from "svelte";

    const { box } = $props<{ box: StringReplacerBox }>();
    let theBox: StringReplacerBox | null = null;
    let value = $state("");
    let inputElement: HTMLInputElement | null = null;
    let isTouched = $state(false);
    // Tracks when user explicitly confirms country code with a space after +<cc>
    let confirmedCountryCodeLength: number | null = null;

    const MAX_DIGITS = 15; // E.164 max digits (excluding '+')
    function isValidPhone(str: string): boolean {
        // Accept common phone patterns: digits, spaces, dashes, parentheses, leading +; at least 7 digits
        const cleaned = str.replace(/[^\d]/g, "");
        return cleaned.length >= 7 && cleaned.length <= MAX_DIGITS;
    }

    function normalizeForStorage(str: string): string {
        const trimmed = str.trim();
        const hasPlus = trimmed.startsWith("+");
        let digits = trimmed.replace(/[^\d]/g, "");
        if (digits.length > MAX_DIGITS) {
            digits = digits.slice(0, MAX_DIGITS);
        }
        return (hasPlus ? "+" : "") + digits;
    }

    // Minimal country code list for auto-detection; user can always confirm with a space
    const COUNTRY_CODES = [
        "1",  // US/CA
        "44", // UK
        "49", // DE
        "61", // AU
        "81", // JP
        "82", // KR
        "86", // CN
        "91"  // IN
    ];

    function resolveCountryCodeLength(digits: string): number | null {
        if (confirmedCountryCodeLength && confirmedCountryCodeLength <= digits.length) {
            return confirmedCountryCodeLength;
        }
        // Try to resolve uniquely among known codes by prefix (1-3 digits)
        const candidates = COUNTRY_CODES.filter((cc) => digits.startsWith(cc));
        if (candidates.length === 1) {
            return candidates[0].length;
        }
        return null; // ambiguous; wait for more digits or a space confirmation
    }

    function formatForDisplay(stored: string): string {
        if (!stored) return "";
        if (stored === "+") {
            // Show the plus while user begins typing country code
            return "+";
        }
        if (stored.startsWith("+")) {
            // Basic international grouping: +<cc> <xxx> <xxx> <xxxx>
            const digits = stored.slice(1);
            const parts: string[] = [];
            // Determine cc length: confirmed by space or uniquely detected; otherwise show raw +digits until more info
            const ccLen = resolveCountryCodeLength(digits);
            if (!ccLen) {
                return "+" + digits; // defer formatting until cc resolved
            }
            const cc = digits.slice(0, ccLen);
            let rest = digits.slice(ccLen);
            if (cc.length > 0) parts.push("+" + cc);
            while (rest.length > 4) {
                parts.push(rest.slice(0, 3));
                rest = rest.slice(3);
            }
            if (rest.length > 0) parts.push(rest);
            return parts.join(" ");
        }
        const digits = stored.replace(/[^\d]/g, "");
        if (digits.length >= 10) {
            const a = digits.slice(0, 3);
            const b = digits.slice(3, 6);
            const c = digits.slice(6, 10);
            const extra = digits.slice(10);
            return `(${a}) ${b}-${c}${extra ? " " + extra : ""}`;
        } else if (digits.length >= 7) {
            const a = digits.slice(0, 3);
            const b = digits.slice(3, 7);
            const extra = digits.slice(7);
            return `${a}-${b}${extra ? " " + extra : ""}`;
        }
        return digits;
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
        const raw = (e.target as HTMLInputElement).value;
        // If user types a space after +<cc>, lock that country code length
        const match = raw.match(/^\+(\d{1,3})\s/);
        confirmedCountryCodeLength = match ? match[1].length : confirmedCountryCodeLength;
        const stored = normalizeForStorage(raw);
        const display = formatForDisplay(stored);
        value = display;
        const setter: any = theBox as any;
        if (setter && typeof setter.setPropertyValue === "function") {
            setter.setPropertyValue(stored);
        }
        if (isTouched && isValidPhone(stored)) {
            isTouched = false;
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
            event.key.length === 1
        ) {
            event.stopPropagation();
        }
    }

    let showError = $state(false);
    $effect(() => {
        const trimmed = value.trim();
        const next = isTouched && trimmed.length > 0 && !isValidPhone(trimmed);
        if (showError !== next) {
            showError = next;
        }
    });
</script>

<span class="inline-flex flex-col align-middle w-full">
    <span class="relative inline-block w-full">
        <input
            bind:this={inputElement}
            class="text-component-input pr-8 w-full"
            type="tel"
            placeholder="(555) 123-4567"
            bind:value={value}
            oninput={onInputChange}
            onkeydown={onKeyDown}
            onpaste={(e) => {
                setTimeout(() => {
                    const el = e.target as HTMLInputElement;
                    const raw = el.value;
                    const match = raw.match(/^\+(\d{1,3})\s/);
                    confirmedCountryCodeLength = match ? match[1].length : confirmedCountryCodeLength;
                    const stored = normalizeForStorage(raw);
                    value = formatForDisplay(stored);
                    const setter: any = theBox as any;
                    if (setter && typeof setter.setPropertyValue === "function") {
                        setter.setPropertyValue(stored);
                    }
                }, 0);
            }}
            onblur={() => {
                if (inputElement) {
                    const raw = inputElement.value;
                    const match = raw.match(/^\+(\d{1,3})\s/);
                    confirmedCountryCodeLength = match ? match[1].length : confirmedCountryCodeLength;
                    const stored = normalizeForStorage(raw);
                    value = formatForDisplay(stored);
                    const setter: any = theBox as any;
                    if (setter && typeof setter.setPropertyValue === "function") {
                        setter.setPropertyValue(stored);
                    }
                }
                isTouched = !isValidPhone(normalizeForStorage(value));
            }}
        />
        <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 z-10" style="color: var(--green-90t);">
            <Phone class="w-4 h-4" />
        </span>
    </span>
    {#if showError}
        <span class="small-label-text mt-1 self-start" style="color:#ef4444">Enter a valid phone number.</span>
    {/if}
</span>


