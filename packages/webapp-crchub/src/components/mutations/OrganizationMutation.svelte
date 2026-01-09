<script lang="ts">
    // @ts-ignore
    import { Save as IconSave, X as IconX, Asterisk as IconAsterisk } from '@lucide/svelte';
    import { onMount } from 'svelte';
    import { env } from '../../config/env.js';

    const { organization, action, onsave, onclose } = $props<{
        organization: any;
        action: "add" | "edit";
        onsave?: (organization: any) => void;
        onclose?: () => void;
    }>();

    let mutatedOrganization = $state<any>({});
    let orgTypes = $state<Array<{id: string, name: string}>>([]);
    let orgSubtypes = $state<Array<{id: string, name: string}>>([]);
    let allOrgSubtypes = $state<Array<{id: string, name: string}>>([]);
    let isLoadingSubtypes = $state(false);
    let initializedOrgId = $state<string | undefined>(undefined);

    // Function to filter subtypes based on selected type
    async function filterSubtypesByType(orgTypeId: string | undefined) {
        if (orgTypeId) {
            isLoadingSubtypes = true;
            try {
                const url = `${env.serverUrl}/getOrgSubtypes?org_type_id=${orgTypeId}`;
                const response = await fetch(url);
                if (response.ok) {
                    const filtered = await response.json();
                    orgSubtypes = filtered;
                    // Clear subtype selection if current selection is not in filtered list
                    if (mutatedOrganization.orgSubtypeId && !filtered.find((s: {id: string}) => s.id === mutatedOrganization.orgSubtypeId)) {
                        mutatedOrganization.orgSubtypeId = '';
                    }
                } else {
                    orgSubtypes = [];
                }
            } catch (error) {
                console.error('Error fetching filtered org subtypes:', error);
                orgSubtypes = [];
            } finally {
                isLoadingSubtypes = false;
            }
        } else {
            // If no type selected, show all subtypes
            orgSubtypes = allOrgSubtypes;
            mutatedOrganization.orgSubtypeId = '';
        }
    }

    onMount(async () => {
        // Fetch org types and subtypes
        try {
            const typesResponse = await fetch(`${env.serverUrl}/getOrgTypes`);
            if (typesResponse.ok) {
                orgTypes = await typesResponse.json();
            }
            const subtypesResponse = await fetch(`${env.serverUrl}/getOrgSubtypes`);
            if (subtypesResponse.ok) {
                allOrgSubtypes = await subtypesResponse.json();
                // If organization already has a type (edit mode), filter immediately
                if (mutatedOrganization.orgTypeId) {
                    await filterSubtypesByType(mutatedOrganization.orgTypeId);
                } else {
                    orgSubtypes = allOrgSubtypes;
                }
            }
        } catch (error) {
            console.error('Error fetching org types/subtypes:', error);
        }
    });

    // Filter subtypes based on selected type when it changes
    $effect(() => {
        if (mutatedOrganization.orgTypeId) {
            filterSubtypesByType(mutatedOrganization.orgTypeId);
        } else {
            orgSubtypes = allOrgSubtypes;
            mutatedOrganization.orgSubtypeId = '';
        }
    });

    function getErrorState(field: keyof typeof errors) {
        return errorState[field] ? "error" : "";
    }

    // Format date for input field (YYYY-MM-DD format)
    function formatDateForInput(dateValue: string | null | undefined): string | undefined {
        if (!dateValue) {
            console.log("[OrganizationMutation] formatDateForInput: dateValue is empty/null/undefined");
            return undefined;
        }
        // Handle different date formats from backend
        // Could be: "2025-11-26", "2025-11-26T00:00:00Z", "2025-11-26T00:00:00.000Z", etc.
        if (typeof dateValue === 'string') {
            // Remove any time portion - extract just the date part (YYYY-MM-DD)
            const dateStr = dateValue.split('T')[0].split(' ')[0];
            // Validate it matches YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                console.log("[OrganizationMutation] formatDateForInput: Successfully formatted", dateValue, "->", dateStr);
                return dateStr;
            } else {
                console.warn("[OrganizationMutation] formatDateForInput: Date string doesn't match YYYY-MM-DD format:", dateStr);
            }
        }
        console.warn("[OrganizationMutation] formatDateForInput: Could not parse date:", dateValue, "type:", typeof dateValue);
        return undefined;
    }

    // Update mutatedOrganization when organization prop changes
    $effect(() => {
        if (!organization) {
            mutatedOrganization = {};
            initializedOrgId = undefined;
            return;
        }
        
        const orgId = organization.id;
        // Update if this is a different organization or if we haven't initialized yet
        if (orgId !== initializedOrgId) {
            initializedOrgId = orgId;
            // Copy all properties from organization
            mutatedOrganization = { ...organization };
            
            // Ensure startDate and endDate are properly formatted for input fields (YYYY-MM-DD)
            mutatedOrganization.startDate = formatDateForInput(organization.startDate);
            mutatedOrganization.endDate = formatDateForInput(organization.endDate);
            
            console.log("[OrganizationMutation] Loaded organization:", {
                id: organization.id,
                name: organization.name,
                originalDates: { 
                    startDate: organization.startDate, 
                    endDate: organization.endDate 
                },
                formattedDates: { 
                    startDate: mutatedOrganization.startDate, 
                    endDate: mutatedOrganization.endDate 
                },
                fullOrganization: organization
            });
            
            // If organization has a type and subtypes are loaded, filter them
            if (organization.orgTypeId && allOrgSubtypes.length > 0) {
                filterSubtypesByType(organization.orgTypeId);
            }
        }
    });

    $effect(() => {
        console.log("[OrganizationMutation] $effect action:", action, "organization:", organization);
        if (action === "edit" && organization) {
            validateAllFields();
        }
    });

    const errors = $state({
        name: "",
        startDate: "",
    });
    const errorState = $state({ ...errors });
    let hasErrors = $derived(Object.values(errorState).some((error) => error !== ""));

    $effect(() => {
        validateAllFields();
        console.log("[OrganizationMutation] errors:", errors);
        console.log("[OrganizationMutation] errorState:", errorState);
    });

    function handleSave() {
        validateAllFields();
        if (Object.values(errorState).every((error) => error === "")) {
            console.log("[OrganizationMutation] calling onsave prop", mutatedOrganization);
            onsave?.(mutatedOrganization);
        }
    }

    function handleClose() {
        console.log("[OrganizationMutation] calling onclose prop");
        onclose?.();
    }

    function handleInput(field: keyof typeof errors) {
        return (event: Event) => {
            const target = event.target as HTMLInputElement;
            validateField(field, target.value);
        };
    }

    function validateAllFields() {
        (Object.keys(mutatedOrganization) as Array<keyof typeof errors>).forEach((key) => {
            if (key in errors) {
                validateField(key, mutatedOrganization[key]);
            }
        });
    }

    function validateField(field: keyof typeof errors, value: string) {
        if (field === "name" && !value.trim()) {
            errors[field] = "Name is required";
        } else if (field === "startDate" && !value) {
            errors[field] = "Start date is required";
        } else {
            errors[field] = "";
        }
        errorState[field] = errors[field];
    }
</script>

<div class="mutation-area max-w-sm">
    <div class="flex flex-col gap-4">
        <div>
            <div class="small-label-text">Name{#if errors.name}<IconAsterisk size="12" color="red" />{/if}</div>
            <input class="input-field {getErrorState('name')}" type="text" bind:value={mutatedOrganization.name} oninput={handleInput("name")} />
        </div>
        <div>
            <div class="small-label-text">Type</div>
            <select class="select-field" bind:value={mutatedOrganization.orgTypeId}>
                <option value="">Select type...</option>
                {#each orgTypes as orgType}
                    <option value={orgType.id}>{orgType.name}</option>
                {/each}
            </select>
        </div>
        <div>
            <div class="small-label-text">Subtype</div>
            <select 
                class="select-field" 
                bind:value={mutatedOrganization.orgSubtypeId}
                disabled={mutatedOrganization.orgTypeId && !isLoadingSubtypes && orgSubtypes.length === 0}
            >
                {#if mutatedOrganization.orgTypeId && !isLoadingSubtypes && orgSubtypes.length === 0}
                    <option value="">None</option>
                {:else}
                    <option value="">Select subtype...</option>
                    {#each orgSubtypes as orgSubtype}
                        <option value={orgSubtype.id}>{orgSubtype.name}</option>
                    {/each}
                {/if}
            </select>
        </div>
        <div>
            <div class="small-label-text">
                <label>
                    <input type="checkbox" bind:checked={mutatedOrganization.isDomain} />
                    Is Domain
                </label>
            </div>
        </div>
        <div>
            <div class="small-label-text">Start Date{#if errors.startDate}<IconAsterisk size="12" color="red" />{/if}</div>
            <input class="input-field {getErrorState('startDate')}" type="date" bind:value={mutatedOrganization.startDate} oninput={handleInput("startDate")} required />
        </div>
        <div>
            <div class="small-label-text">End Date</div>
            <input class="input-field" type="date" bind:value={mutatedOrganization.endDate} />
        </div>
    </div>
    <div class="mutation-buttons">
        <button class="standard-button primary inverted" onclick={handleSave} disabled={hasErrors}><IconSave size="16" />Save</button>
        <button class="standard-button gray inverted" onclick={handleClose}><IconX size="16" />Cancel</button>
    </div>
</div>



