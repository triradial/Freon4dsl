<script lang="ts">
    import { dataStore } from "../../../services/data/data-store.js";
    import { onMount, onDestroy } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { theme } from "../../../services/stores/theme-store.js";
    import { userStore } from "../../../services/stores/users-store.js";
    // @ts-ignore
    import { Plus as IconPlus, RefreshCcw as IconRefresh } from '@lucide/svelte';

    let { studyId, onPersonSelected = $bindable() } = $props<{ 
        studyId: string; 
        onPersonSelected?: (personId: string | null, personName: string | null) => void;
    }>();

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let organizationId = $state<string | null>(null);
    let organizationPeople = $state<any[]>([]);
    let user = null;
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");
    let selectedPersonId = $state<string | null>(null);
    let selectedPersonName = $state<string | null>(null);

    let updateTimeout: any = null;
    let userUnsubscribe;

    $effect(() => {
        void gridApi;
        void organizationPeople;
        if (gridApi && organizationPeople) {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                gridApi.setGridOption("rowData", organizationPeople);
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
                gridApi.setGridOption("loading", false);
            }, 100);
        }
    });

    async function loadOrganizationPeople() {
        if (!studyId) {
            console.log('[FacilityPeopleGrid] No studyId provided');
            return;
        }
        
        console.log('[FacilityPeopleGrid] Loading people for study:', studyId);
        
        // Get the site for this study to find the organization
        const site = await dataStore.getUserStudySite(studyId);
        console.log('[FacilityPeopleGrid] Site loaded:', site);
        
        if (site && site.orgId) {
            organizationId = site.orgId;
            console.log('[FacilityPeopleGrid] Organization ID:', organizationId);
            
            // Load all persons and filter to this organization
            await dataStore.getPersons();
            const allPersons = $dataStore.persons;
            console.log('[FacilityPeopleGrid] Total persons:', allPersons.length);
            
            // Filter persons who belong to this organization
            // Note: The organization array has org_id, not organizationId
            organizationPeople = allPersons.filter(person => {
                const belongsToOrg = person.organizations?.some((org: any) => org.org_id === organizationId);
                if (belongsToOrg) {
                    console.log('[FacilityPeopleGrid] Person matches org:', person.name, person.organizations);
                }
                return belongsToOrg;
            }).map(person => {
                // Get organization info for this specific organization
                const orgInfo = person.organizations?.find((org: any) => org.org_id === organizationId);
                return {
                    ...person,
                    roleName: orgInfo?.roleName || orgInfo?.role_name || '',
                    isUser: !!person.userid
                };
            });
            
            console.log('[FacilityPeopleGrid] Filtered organization people:', organizationPeople.length, organizationPeople);
        } else {
            console.error('[FacilityPeopleGrid] No site or orgId found');
        }
    }


    function getSVGIcon(type: string): string {
        if (type === "trash") {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>`;
        }
        return "";
    }

    function onDeleteClick(personData: any) {
        // TODO: Implement delete functionality
        console.log("Delete person:", personData);
    }

    onMount(() => {
        userUnsubscribe = userStore.subscribe((val) => {
            user = val;
        });

        const gridElement = document.querySelector("#facilityPeopleGrid") as HTMLElement;
        if (!gridElement) {
            console.error('[FacilityPeopleGrid] Grid element not found');
            return;
        }

        function createNameCellRenderer(params: any) {
            const container = document.createElement('div');
            container.className = 'person-name-cell-container';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.gap = '8px';
            container.style.width = '100%';
            
            const nameContainer = document.createElement('div');
            nameContainer.style.display = 'flex';
            nameContainer.style.alignItems = 'center';
            nameContainer.style.gap = '8px';
            nameContainer.style.flex = '1';
            
            // Add user icon if this person is a user
            if (params.data?.isUser) {
                const iconSpan = document.createElement('span');
                iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
                iconSpan.style.color = '#4CAF50';
                iconSpan.style.display = 'flex';
                iconSpan.style.alignItems = 'center';
                nameContainer.appendChild(iconSpan);
            }
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = params.data?.name || '';
            nameContainer.appendChild(nameSpan);
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'grid-actions';
            actionsDiv.style.display = 'none';
            actionsDiv.style.gap = '4px';
            
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = getSVGIcon('trash');
            deleteButton.className = 'grid-button delete-button';
            deleteButton.title = 'Remove from Facility';
            deleteButton.onclick = (e) => {
                e.stopPropagation();
                onDeleteClick(params.data);
            };
            
            actionsDiv.appendChild(deleteButton);
            
            container.onmouseenter = () => {
                actionsDiv.style.display = 'flex';
            };
            container.onmouseleave = () => {
                actionsDiv.style.display = 'none';
            };
            
            container.appendChild(nameContainer);
            container.appendChild(actionsDiv);
            
            return container;
        }

        gridOptions = {
            columnDefs: [
                {
                    field: "name",
                    headerName: "Name",
                    flex: 1,
                    minWidth: 200,
                    suppressSizeToFit: false,
                    cellRenderer: createNameCellRenderer
                }
            ],
            rowData: [],
            rowSelection: {
                mode: 'singleRow',
                checkboxes: true
            },
            defaultColDef: {
                sortable: true,
                resizable: true
            },
            suppressScrollOnNewData: true,
            overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No staff to display</span>',
            domLayout: 'normal',
            onGridReady: (params) => {
                gridApi = params.api;
                gridApi.setGridOption("loading", true);
                // Force column visibility
                setTimeout(() => {
                    if (gridApi) {
                        gridApi.sizeColumnsToFit();
                        gridApi.autoSizeAllColumns();
                        gridApi.setGridOption("loading", false);
                    }
                }, 100);
            },
            onSelectionChanged: (event: any) => {
                const selectedRows = event.api.getSelectedRows();
                if (selectedRows.length > 0) {
                    const person = selectedRows[0];
                    selectedPersonId = person.id;
                    selectedPersonName = person.name;
                    if (onPersonSelected) {
                        onPersonSelected(selectedPersonId, selectedPersonName);
                    }
                } else {
                    selectedPersonId = null;
                    selectedPersonName = null;
                    if (onPersonSelected) {
                        onPersonSelected(null, null);
                    }
                }
            }
        };

        gridApi = createGrid(gridElement, gridOptions);
        loadOrganizationPeople();
    });

    onDestroy(() => {
        if (userUnsubscribe) userUnsubscribe();
    });

    function refreshPeople() {
        loadOrganizationPeople();
    }

    function addStaffMember() {
        // TODO: Implement add staff member dialog
        console.log("Add staff member - to be implemented");
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@33.3.4/styles/ag-grid.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@33.3.4/styles/ag-theme-quartz.min.css" />
</svelte:head>

<div class="facility-people-section">
    <div class="grid-toolbar">
        <button type="button" class="standard-button primary inverted" onclick={addStaffMember} aria-label="Add Staff">
            <IconPlus size="16" />Add Staff
        </button>
        <div style="flex: 1;"></div>
        <button type="button" class="grid-button green-button" onclick={refreshPeople} title="Refresh" aria-label="Refresh">
            <IconRefresh size={16} />
        </button>
    </div>

    <div id="facilityPeopleGrid" class="{gridTheme} ag-grid facility-people-grid"></div>
</div>

<style>
    .facility-people-section {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .facility-people-grid {
        width: 100%;
        height: 400px;
    }

    .grid-toolbar {
        display: flex;
        gap: 8px;
        padding: 8px;
        align-items: center;
        background-color: var(--color-surface-100);
        border-bottom: 1px solid var(--color-surface-300);
    }

    .standard-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .standard-button.primary {
        background-color: var(--color-primary-500);
        color: white;
    }

    .standard-button.danger {
        background-color: var(--color-error-500);
        color: white;
    }

    .standard-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .grid-button {
        padding: 6px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background-color: transparent;
        transition: background-color 0.2s;
    }

    .green-button {
        color: var(--color-success-600);
    }

    .green-button:hover {
        background-color: var(--color-success-100);
    }

</style>

