<script lang="ts">
    import { untrack } from "svelte";
    import { getStatusColor } from "../../services/utils.js";
    import { dataStore, type Study } from "../../services/data/data-store.js";
    import type { StudyTemplate } from "../../services/data/study-templates.js";
    import { Combobox } from "@skeletonlabs/skeleton-svelte";
    // @ts-ignore
    import { Save as IconSave, X as IconX, Asterisk as IconAsterisk } from '@lucide/svelte';

    // svelte-ignore state_referenced_locally - study/action are read at call time in event handlers
    const { study, action, adminMode = false, onsave, onclose } = $props<{
        study: Study;
        action: "add" | "edit" | "copy";
        adminMode?: boolean;
        onsave?: (study: Study) => void;
        onclose?: () => void;
    }>();

    // Use $state with initial empty object, then sync via $effect
    let mutatedStudy = $state<Study>({} as Study);
    let siteNumber = $state('');
    let siteId = $state<string | undefined>(undefined);
    let rows: number = 6;

    // Copy mode: template list and selected template (for Combobox)
    const copyTemplates = $derived((study as any)?.templates as StudyTemplate[] | undefined);
    const hasTemplateChoice = $derived(action === "copy" && Array.isArray(copyTemplates) && copyTemplates.length > 0);
    let selectedTemplate = $state<StudyTemplate | null>(null);
    const templateComboboxData = $derived(
        (copyTemplates ?? []).map((t) => ({ label: t.label, value: t.id }))
    );
    const selectedTemplateId = $derived(selectedTemplate?.id ?? "");

    let nameValidationTimeout: ReturnType<typeof setTimeout> | null = null;
    let nameValidationId = 0;
    let siteNumberValidationTimeout: ReturnType<typeof setTimeout> | null = null;
    let siteNumberValidationId = 0;

    let statusColor = $derived(getStatusColor(mutatedStudy.status));
    
    function getErrorState(field: keyof typeof errors) {
        return errorState[field] ? "error" : "";
    }

    function getErrorTooltip(field: keyof typeof errors): string {
        const error = errors[field];
        if (!error) return "";
        if (error.toLowerCase().includes("required")) return "Required";
        if (error.toLowerCase().includes("exists") || error.toLowerCase().includes("duplicate")) return "Duplicate";
        return "";
    }

    // Update mutatedStudy when study prop changes
    // Use untrack to prevent siteNumber from becoming a dependency
    $effect(() => {
        Object.assign(mutatedStudy, study);
        if (action !== "edit") {
            const currentSiteNumber = untrack(() => siteNumber);
            siteNumber = (study as any)?.siteNumber || currentSiteNumber || "";
        }
        if (action === "copy" && (study as any)?.selectedTemplate) {
            selectedTemplate = (study as any).selectedTemplate;
        }
    });

    function onTemplateValueChange(details: { value: string | string[] }) {
        const value = Array.isArray(details.value) ? details.value[0] : details.value;
        const template = (copyTemplates ?? []).find((t) => t.id === value);
        if (template) {
            selectedTemplate = template;
            (mutatedStudy as any).sourceStudyId = template.sourceStudyId || (mutatedStudy as any)?.sourceStudyId || "";
        }
    }

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
        // Clear pending validation timeouts
        if (nameValidationTimeout) {
            clearTimeout(nameValidationTimeout);
            nameValidationTimeout = null;
        }
        if (siteNumberValidationTimeout) {
            clearTimeout(siteNumberValidationTimeout);
            siteNumberValidationTimeout = null;
        }
        
        // Run final duplicate checks before save
        if (mutatedStudy.name?.trim()) {
            const excludeId = action === "edit" && study?.id ? study.id : undefined;
            await validateNameDuplicate(excludeId);
        }
        if (siteNumber?.trim()) {
            const excludeSiteId = action === "edit" && siteId ? siteId : undefined;
            await validateSiteNumberDuplicate(excludeSiteId);
        }
        
        validateAllFields();
        if (Object.values(errorState).every((error) => error === "")) {
            console.log("[StudyMutation] calling onsave prop", mutatedStudy);
            if (action === "add" || action === "copy") {
                // For copy, use current sourceStudyId from mutation (may have been changed via template Combobox)
                const sourceStudyId = (mutatedStudy as any)?.sourceStudyId ?? (study as any)?.sourceStudyId;
                onsave?.({ ...mutatedStudy, siteNumber, sourceStudyId } as any);
            } else {
                // For edit action, save the study and update the site number
                onsave?.(mutatedStudy);
                // Update the site number if it changed
                if (siteId) {
                    await dataStore.updateSiteNumber(siteId, siteNumber);
                }
            }
        }
    }

    function handleClose() {
        console.log("[StudyMutation] calling onclose prop");
        onclose?.();
    }

    async function validateNameDuplicate(excludeId?: string) {
        const id = ++nameValidationId;
        const currentValue = mutatedStudy.name?.trim() ?? "";
        const exists = await dataStore.checkStudyNameExists(currentValue, excludeId, adminMode);
        if (id !== nameValidationId) return;
        if (exists && currentValue) {
            errors.name = "Study name already exists";
        } else {
            errors.name = currentValue ? "" : "Study name is required";
        }
        errorState.name = errors.name;
    }

    async function validateSiteNumberDuplicate(excludeSiteId?: string) {
        const id = ++siteNumberValidationId;
        const currentValue = siteNumber?.trim() ?? "";
        const exists = await dataStore.checkSiteNumberExists(currentValue, excludeSiteId, adminMode);
        if (id !== siteNumberValidationId) return;
        if (exists && currentValue) {
            errors.siteNumber = "Site number already exists";
        } else {
            errors.siteNumber = currentValue ? "" : "Site number is required";
        }
        errorState.siteNumber = errors.siteNumber;
    }

    function handleInput(field: keyof typeof errors) {
        return (event: Event) => {
            const target = event.target as HTMLInputElement;
            validateField(field, target.value);
        };
    }

    function validateAllFields() {
        console.log("[StudyMutation] validateAllFields called - mutatedStudy.name:", mutatedStudy.name, "siteNumber:", siteNumber);
        validateField("name", mutatedStudy.name);
        validateField("siteNumber", siteNumber);
    }

    function validateField(field: keyof typeof errors, value: string | undefined) {
        const strValue = value || "";
        if (field === "name") {
            if (!strValue.trim()) {
                errors.name = "Study name is required";
                errorState.name = errors.name;
            } else {
                errors.name = "";
                errorState.name = "";
                if (nameValidationTimeout) clearTimeout(nameValidationTimeout);
                const excludeId = action === "edit" && study?.id ? study.id : undefined;
                nameValidationTimeout = setTimeout(() => validateNameDuplicate(excludeId), 300);
            }
        } else if (field === "siteNumber") {
            if (!strValue.trim()) {
                errors.siteNumber = "Site number is required";
                errorState.siteNumber = errors.siteNumber;
            } else {
                // Clear error immediately for responsive UX, then validate async
                errors.siteNumber = "";
                errorState.siteNumber = "";
                if (siteNumberValidationTimeout) clearTimeout(siteNumberValidationTimeout);
                const excludeSiteId = action === "edit" && siteId ? siteId : undefined;
                siteNumberValidationTimeout = setTimeout(() => validateSiteNumberDuplicate(excludeSiteId), 300);
            }
        }
    }
</script>

<div class="mutation-area max-w-sm">
    <div class="flex flex-col gap-4">
        {#if hasTemplateChoice}
            <div>
                <div class="small-label-text">Template</div>
                <Combobox
                    data={templateComboboxData}
                    value={selectedTemplateId ? [selectedTemplateId] : []}
                    onValueChange={onTemplateValueChange}
                    label=""
                    labelBase="!p-0"
                    contentMaxHeight="max-h-[240px]"
                    width="w-full"
                />
            </div>
        {/if}
        <div>
            <div class="small-label-text">Study Name{#if errors.name}<span class="error-indicator"><IconAsterisk size="12" color="red" /></span>{/if}</div>        
            <input class="input-field {getErrorState('name')}" type="text" bind:value={mutatedStudy.name} oninput={handleInput("name")} title={getErrorTooltip('name')} />
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
            <div class="small-label-text">Site Number{#if errors.siteNumber}<span class="error-indicator"><IconAsterisk size="12" color="red" /></span>{/if}</div>
            <input class="input-field {getErrorState('siteNumber')}" type="text" bind:value={siteNumber} oninput={handleInput("siteNumber")} title={getErrorTooltip('siteNumber')} />
        </div>
    </div>
    <div class="mutation-buttons">
        <button class="standard-button primary inverted" onclick={handleSave} disabled={hasErrors}><IconSave size="16" />Save</button>
        <button class="standard-button gray inverted" onclick={handleClose}><IconX size="16" />Cancel</button>
    </div>
</div>

<style>
    .error-indicator {
        display: inline-flex;
        margin-left: 4px;
    }
</style>
