<script lang="ts">
    import { untrack } from "svelte";
    import { getStatusColor } from "../../services/utils.js";
    import { type Study } from "../../services/data/data-store.js";
    // @ts-ignore
    import { Save as IconSave, X as IconX, Asterisk as IconAsterisk } from '@lucide/svelte';

    const { study, action, onsave, onclose } = $props<{
        study: Study;
        action: "add" | "edit" | "copy";
        onsave?: (study: Study) => void;
        onclose?: () => void;
    }>();

    // Use $state with initial empty object, then sync via $effect
    let mutatedStudy = $state<Study>({} as Study);
    let siteNumber = $state('');
    let siteId = $state<string | undefined>(undefined);
    let rows: number = 6;

    let statusColor = $derived(getStatusColor(mutatedStudy.status));
    
    function getErrorState(field: keyof typeof errors) {
        return errorState[field] ? "error" : "";
    }

    // Update mutatedStudy when study prop changes
    // Use untrack to prevent siteNumber from becoming a dependency
    $effect(() => {
        Object.assign(mutatedStudy, study);
        if (action !== "edit") {
            const currentSiteNumber = untrack(() => siteNumber);
            siteNumber = (study as any)?.siteNumber || currentSiteNumber || "";
        }
    });

    // Track initialization
    let initialized = false;

    // Initialize on mount
    $effect(() => {
        if (!initialized) {
            initialized = true;
            console.log("[StudyMutation] Component initialized - action:", action, "study:", study);
            
            // If editing, fetch site info first before validating
            if (action === "edit" && study && study.id) {
                console.log("[StudyMutation] Edit mode - fetching site info before validation");
                fetchSiteInfo().then(() => {
                    console.log("[StudyMutation] Site info loaded, now running validation");
                    validateAllFields();
                    console.log("[StudyMutation] Validation complete - errors:", errors);
                });
            } else {
                // For add/copy mode, set default status if missing and run validation immediately
                if (action === "add") {
                    console.log("[StudyMutation] Add mode - setting default status to Planning");
                } else if (action === "copy") {
                    console.log("[StudyMutation] Copy mode - preparing defaults");
                }
                if (!mutatedStudy.status) {
                    mutatedStudy.status = "Planning";
                }
                validateAllFields();
                console.log("[StudyMutation] Validation complete - errors:", errors);
            }
        }
    });

    async function fetchSiteInfo() {
        if (!study.id) return;
        console.log("[StudyMutation] fetchSiteInfo: Fetching site for study ID:", study.id);
        const { dataStore } = await import("../../services/data/data-store.js");
        const site = await dataStore.getUserStudySite(study.id);
        console.log("[StudyMutation] fetchSiteInfo: Site received:", site);
        if (site) {
            siteNumber = site.siteNumber || '';
            siteId = site.id;
            console.log("[StudyMutation] fetchSiteInfo: Set siteNumber to:", siteNumber, "siteId:", siteId);
            // Re-validate after loading site info
            validateField("siteNumber", siteNumber);
        } else {
            console.log("[StudyMutation] fetchSiteInfo: No site found for study");
        }
    }

    const errors = $state({
        name: "",
        siteNumber: "",
    });
    const errorState = $state({ ...errors });
    let hasErrors = $derived(Object.values(errorState).some((error) => error !== ""));

    async function handleSave() {
        validateAllFields();
        if (Object.values(errorState).every((error) => error === "")) {
            console.log("[StudyMutation] calling onsave prop", mutatedStudy);
            if (action === "add" || action === "copy") {
                // For add action, include the site number
                onsave?.({ ...mutatedStudy, siteNumber, sourceStudyId: (study as any)?.sourceStudyId } as any);
            } else {
                // For edit action, save the study and update the site number
                onsave?.(mutatedStudy);
                // Update the site number if it changed
                if (siteId) {
                    const { dataStore } = await import("../../services/data/data-store.js");
                    await dataStore.updateSiteNumber(siteId, siteNumber);
                }
            }
        }
    }

    function handleClose() {
        console.log("[StudyMutation] calling onclose prop");
        onclose?.();
    }

    function handleInput(field: keyof typeof errors) {
        return (event: Event) => {
            const target = event.target as HTMLInputElement;
            validateField(field, target.value);
        };
    }

    function validateAllFields() {
        console.log("[StudyMutation] validateAllFields called - mutatedStudy.name:", mutatedStudy.name, "siteNumber:", siteNumber);
        // Validate study name
        validateField("name", mutatedStudy.name);
        // Validate site number
        validateField("siteNumber", siteNumber);
    }

    function validateField(field: keyof typeof errors, value: string | undefined) {
        const strValue = value || '';
        console.log(`[StudyMutation] Validating ${field}: value="${strValue}"`);
        if (field === "name" && !strValue.trim()) {
            errors[field] = "Study name is required";
            console.log(`[StudyMutation] ${field} validation failed - required`);
        } else if (field === "siteNumber" && !strValue.trim()) {
            errors[field] = "Site number is required";
            console.log(`[StudyMutation] ${field} validation failed - required`);
        } else {
            errors[field] = "";
            console.log(`[StudyMutation] ${field} validation passed`);
        }
        errorState[field] = errors[field];
        console.log(`[StudyMutation] After validation - errors.${field}="${errors[field]}", errorState.${field}="${errorState[field]}"`);
    }
</script>

<div class="mutation-area max-w-sm">
    <div class="flex flex-col gap-4">
        <div>
            <div class="small-label-text">Study Name{#if errors.name}<IconAsterisk size="12" color="red" />{/if}</div>        
            <input class="input-field {getErrorState('name')}" type="text" bind:value={mutatedStudy.name} oninput={handleInput("name")} />
        </div>
        <div>
            <div class="small-label-text">Title</div>
            <textarea class="textarea-field min-h-[5rem]" rows={rows} bind:value={mutatedStudy.title}></textarea>
        </div>
        <div>
            <div class="small-label-text">Status</div>
            <select class="select-field" bind:value={mutatedStudy.status}>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Suspended">Suspended</option>
                <option value="Withdrawn">Withdrawn</option>
            </select>
        </div>
        <div>
            <div class="small-label-text">Phase</div>
            <input class="input-field" type="text" bind:value={mutatedStudy.phase}  />
        </div>
        <div>
            <div class="small-label-text">Therapeutic Area</div>
            <input class="input-field" type="text" bind:value={mutatedStudy.therapeuticArea}  />
        </div>
        <div>
            <div class="small-label-text">Current Protocol</div>
            <input class="input-field" type="text" bind:value={mutatedStudy.currentProtocol}  />
        </div>
        <hr class="separator-divider" />
        <div>
            <div class="small-label-text">Site Number{#if errors.siteNumber}<IconAsterisk size="12" color="red" />{/if}</div>
            <input class="input-field {getErrorState('siteNumber')}" type="text" bind:value={siteNumber} oninput={handleInput("siteNumber")} />
        </div>
    </div>
    <div class="mutation-buttons">
        <button class="standard-button primary inverted" onclick={handleSave} disabled={hasErrors}><IconSave size="16" />Save</button>
        <button class="standard-button gray inverted" onclick={handleClose}><IconX size="16" />Cancel</button>
    </div>
</div>
