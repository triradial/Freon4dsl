<script lang="ts">
    // @ts-ignore
    import { Save as IconSave, X as IconX, Asterisk as IconAsterisk } from '@lucide/svelte';
    import { dataStore } from '../../services/data/data-store.js';
    import GroupedListboxSelector from '../common/GroupedListboxSelector.svelte';

    const { person, action, onsave, onclose } = $props<{
        person: any;
        action: "add" | "edit";
        onsave?: (person: any) => void;
        onclose?: () => void;
    }>();

    let mutatedPerson = $state<any>({});
    
    // Initialize mutatedPerson from person prop (this will be updated later by an $effect that also handles organizations)
    
    // Initialize organization and role data
    $effect(() => {
        dataStore.getOrganizations();
        dataStore.getPersonRoles();
    });

    // Get organizations and format for selector
    const organizations = $derived($dataStore.organizations);
    const organizationItems = $derived(
        organizations.map((org: any) => ({
            id: org.id,
            label: org.name,
            group: org.orgTypeName || "Other",
            ...org
        }))
    );
    
    // Get current selected organization
    const selectedOrganization = $derived(
        mutatedPerson.orgId
            ? organizationItems.find((item) => item.id === mutatedPerson.orgId) || null
            : null
    );

    // Get person roles and sort them by name
    const personRoles = $derived(
        [...$dataStore.personRoles].sort((a, b) => {
            // Sort by category first, then by name
            if (a.category !== b.category) {
                return (a.category || '').localeCompare(b.category || '');
            }
            return (a.name || '').localeCompare(b.name || '');
        })
    );
    
    // Handle organization selection
    function handleOrganizationSelect(item: any) {
        if (item) {
            mutatedPerson.orgId = item.id;
        } else {
            mutatedPerson.orgId = null;
        }
        // Validate organization field when it changes
        validateField("orgId", mutatedPerson.orgId);
    }

    function getErrorState(field: keyof typeof errors) {
        return errorState[field] ? "error" : "";
    }

    // Update mutatedPerson when person prop changes
    $effect(() => {
        Object.assign(mutatedPerson, person);
        
        // Extract orgId and roleId from organizations array if they exist
        if (person && person.organizations && person.organizations.length > 0) {
            // Get the first organization (assuming single org for now)
            const firstOrg = person.organizations[0];
            if (firstOrg.org_id) {
                mutatedPerson.orgId = firstOrg.org_id;
            }
            if (firstOrg.role_id) {
                mutatedPerson.roleId = firstOrg.role_id;
            }
        }
    });

    $effect(() => {
        console.log("[PersonMutation] $effect action:", action, "person:", person);
        if (action === "edit" && person) {
            validateAllFields();
        }
    });

    const errors = $state({
        name: "",
        email: "",
        orgId: "",
        roleId: "",
    });
    const errorState = $state({ ...errors });
    let hasErrors = $derived(Object.values(errorState).some((error) => error !== ""));

    $effect(() => {
        validateAllFields();
        console.log("[PersonMutation] errors:", errors);
        console.log("[PersonMutation] errorState:", errorState);
    });

    function handleSave() {
        validateAllFields();
        if (Object.values(errorState).every((error) => error === "")) {
            console.log("[PersonMutation] calling onsave prop", mutatedPerson);
            onsave?.(mutatedPerson);
        }
    }

    function handleClose() {
        console.log("[PersonMutation] calling onclose prop");
        onclose?.();
    }

    function handleInput(field: keyof typeof errors) {
        return (event: Event) => {
            const target = event.target as HTMLInputElement;
            validateField(field, target.value);
        };
    }

    function validateAllFields() {
        // Validate name
        validateField("name", mutatedPerson.name);
        // Validate email
        validateField("email", mutatedPerson.email);
        // Validate organization
        validateField("orgId", mutatedPerson.orgId);
        // Validate role
        validateField("roleId", mutatedPerson.roleId);
    }

    function validateField(field: keyof typeof errors, value: string | null | undefined) {
        const stringValue = value ? String(value).trim() : "";
        
        if (field === "name" && !stringValue) {
            errors[field] = "Name is required";
        } else if (field === "email") {
            if (!stringValue) {
                errors[field] = "Email is required";
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
                errors[field] = "Invalid email format";
            } else {
                errors[field] = "";
            }
        } else if (field === "orgId" && !stringValue) {
            errors[field] = "Organization is required";
        } else if (field === "roleId" && !stringValue) {
            errors[field] = "Role is required";
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
            <input class="input-field {getErrorState('name')}" type="text" bind:value={mutatedPerson.name} oninput={handleInput("name")} />
        </div>
        <div>
            <div class="small-label-text">Email{#if errors.email}<IconAsterisk size="12" color="red" />{/if}</div>
            <input class="input-field {getErrorState('email')}" type="email" bind:value={mutatedPerson.email} oninput={handleInput("email")} />
        </div>
        <div>
            <div class="small-label-text">OID</div>
            <input class="input-field" type="text" bind:value={mutatedPerson.oid} />
        </div>
        <hr class="border-surface-400 dark:border-surface-600" />
        <div>
            <div class="small-label-text">Organization{#if errors.orgId}<IconAsterisk size="12" color="red" />{/if}</div>
            <GroupedListboxSelector
                items={organizationItems}
                currentItem={selectedOrganization}
                onSelect={handleOrganizationSelect}
                placeholder="Select..."
                error={!!errors.orgId}
            />
        </div>
        <div>
            <div class="small-label-text">Role{#if errors.roleId}<IconAsterisk size="12" color="red" />{/if}</div>
            <select class="input-field {getErrorState('roleId')}" placeholder="Select..." bind:value={mutatedPerson.roleId} onchange={() => validateField("roleId", mutatedPerson.roleId)}>
                <option value="">Select...</option>
                {#each personRoles as role}
                    <option value={role.id}>{role.name}</option>
                {/each}
            </select>
        </div>
        <hr class="border-surface-400 dark:border-surface-600" />
        <div class="flex items-center gap-2">
            <input
                type="checkbox"
                id="active-checkbox"
                class="w-4 h-4"
                bind:checked={mutatedPerson.active}
            />
            <label for="active-checkbox" class="small-label-text cursor-pointer">Active</label>
        </div>
    </div>
    <div class="mutation-buttons">
        <button class="standard-button primary inverted" onclick={handleSave} disabled={hasErrors}><IconSave size="16" />Save</button>
        <button class="standard-button gray inverted" onclick={handleClose}><IconX size="16" />Cancel</button>
    </div>
</div>



