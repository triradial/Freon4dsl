<script lang="ts">
    import { dataStore } from "../../../services/data/data-store.js";
    import { editObject, addObject } from "../../../services/stores/object-drawer-store.js";
    import { onMount, onDestroy } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import { theme } from "../../../services/stores/theme-store.js";
    import DeleteObjectDialog from "../../dialogs/DeleteObjectDialog.svelte";
    import { userStore } from "../../../services/stores/users-store.js";
    // @ts-ignore
    import { Plus as IconPlus, RefreshCcw as IconRefresh } from '@lucide/svelte';

    let deleteDialogOpen = $state(false);
    let objectToDelete = $state<any>(null);

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let personsData = $derived($dataStore.persons);
    let user = $derived($userStore);
    let showGrid = $derived(!!user);
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");
    let hasFetched = $state(false);

    let updateTimeout: any = null;
    let filterValue = $state("");

    $effect(() => {
        void gridApi;
        void personsData;
        if (gridApi && personsData) {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                gridApi.setGridOption("rowData", personsData);
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
                gridApi.setGridOption("loading", false);
            }, 100);
        }
    });

    async function fetchPersons() {
        console.log('[PersonGrid] fetchPersons called, user:', user);
        if (!user || !user.oid) {
            console.warn('[PersonGrid] Cannot fetch persons: user not authenticated');
            return;
        }
        if (gridApi) gridApi.setGridOption("loading", true);
        try {
            console.log('[PersonGrid] Calling dataStore.getPersons()');
            await dataStore.getPersons();
            console.log('[PersonGrid] getPersons completed');
        } catch (error) {
            console.error('[PersonGrid] Error fetching persons:', error);
            if (gridApi) gridApi.setGridOption("loading", false);
        }
    }

    $effect(() => {
        const currentUser = user;
        console.log('[PersonGrid] Effect triggered - user:', currentUser, 'gridApi:', !!gridApi, 'hasFetched:', hasFetched);
        if (currentUser && currentUser.oid && gridApi && !hasFetched) {
            console.log('[PersonGrid] Conditions met, fetching persons');
            hasFetched = true;
            fetchPersons();
        }
    });

    function refreshPersons() {
        fetchPersons();
    }

    function onGlobalFilter(e: Event) {
        const target = e.target as HTMLInputElement;
        filterValue = target.value;
        if (gridApi) {
            gridApi.setGridOption("quickFilterText", filterValue);
        }
    }

    function clearSearch() {
        filterValue = "";
        if (gridApi) {
            gridApi.setGridOption("quickFilterText", "");
        }
    }

    function createNameCell(params: any) {
        const container = document.createElement("div");
        container.className = "person-name-cell-container";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "8px";
        container.style.width = "100%";
        
        const nameButton = document.createElement("button");
        nameButton.className = "name-link";
        nameButton.textContent = params.data?.name || "";
        nameButton.style.flex = "1";
        nameButton.style.textAlign = "left";
        
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "grid-actions";
        actionsDiv.style.display = "none";
        actionsDiv.style.gap = "4px";
        
        const editButton = document.createElement("button");
        editButton.innerHTML = getSVGIcon("edit");
        editButton.className = "grid-button general-button";
        editButton.title = "Edit Person";
        editButton.onclick = (e) => {
            e.stopPropagation();
            onEditClick(params.data);
        };
        
        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = getSVGIcon("trash");
        deleteButton.className = "grid-button delete-button";
        deleteButton.title = "Delete Person";
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            onDeleteClick(params.data);
        };
        
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        
        container.onmouseenter = () => {
            actionsDiv.style.display = "flex";
        };
        container.onmouseleave = () => {
            actionsDiv.style.display = "none";
        };
        
        container.appendChild(nameButton);
        container.appendChild(actionsDiv);
        
        return container;
    }

    function getSVGIcon(type: string): string {
        if (type === "edit") {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
        } else if (type === "trash") {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
        }
        return '';
    }

    function formatOrganizationsWithType(organizations: any[]): string {
        if (!organizations || organizations.length === 0) return "";
        const uniqueOrgs = new Map<string, string>();
        organizations.forEach((org: any) => {
            if (!uniqueOrgs.has(org.org_id)) {
                const orgName = org.org_name || org.orgName || '';
                const orgType = (org.org_type_name || org.orgTypeName) ? ` (${org.org_type_name || org.orgTypeName})` : '';
                uniqueOrgs.set(org.org_id, orgName + orgType);
            }
        });
        return Array.from(uniqueOrgs.values()).join(", ");
    }

    function getAdminStatus(person: any): string {
        if (person.is_global_admin || person.isGlobalAdmin) {
            return "Global Admin";
        }
        if (person.is_domain_admin || person.isDomainAdmin) {
            return "Org Admin";
        }
        return "";
    }

    function getPersonStatus(person: any): string {
        const hasOid = !!(person.oid);
        // Active should now always be a boolean from data transformation
        // But handle defensively in case data comes through differently
        const activeValue = person.active;
        const isActive = activeValue === true || 
                        (typeof activeValue === 'string' && activeValue.toLowerCase() === 'true');
        const hasPassword = !!(person.password_hash || person.passwordHash);
        
        if (!hasOid) {
            return "Reference Only";
        }
        
        if (isActive && hasPassword) {
            return "Active";
        }
        
        if (isActive && !hasPassword) {
            return "Indeterminate";
        }
        
        return "Inactive";
    }

    function formatRoles(organizations: any[]): string {
        if (!organizations || organizations.length === 0) return "";
        const roles = new Set(organizations.map((org: any) => org.role_name || org.roleName).filter(Boolean));
        return Array.from(roles).join(", ");
    }

    onMount(() => {
        const gridElement = document.querySelector("#personGrid");
        if (!gridElement) {
            console.error("Grid element not found");
            return;
        }

        gridOptions = {
            columnDefs: [
                {
                    field: "name",
                    headerName: "Name",
                    cellRenderer: createNameCell,
                    filter: "agTextColumnFilter",
                    flex: 2,
                    minWidth: 200,
                    suppressSizeToFit: false
                },
                {
                    headerName: "Organization",
                    filter: "agTextColumnFilter",
                    flex: 2,
                    minWidth: 200,
                    suppressSizeToFit: false,
                    valueGetter: (params: any) => {
                        return formatOrganizationsWithType(params.data?.organizations || []);
                    },
                    comparator: (valueA: string, valueB: string) => {
                        if (!valueA && !valueB) return 0;
                        if (!valueA) return 1;
                        if (!valueB) return -1;
                        return valueA.localeCompare(valueB);
                    }
                },
                {
                    headerName: "Admin",
                    filter: "agTextColumnFilter",
                    flex: 1,
                    minWidth: 120,
                    suppressSizeToFit: false,
                    valueGetter: (params: any) => {
                        return getAdminStatus(params.data || {});
                    }
                },
                {
                    field: "email",
                    headerName: "Email",
                    filter: "agTextColumnFilter",
                    flex: 2,
                    minWidth: 200,
                    suppressSizeToFit: false
                },
                {
                    headerName: "Status",
                    filter: "agTextColumnFilter",
                    flex: 1,
                    minWidth: 150,
                    suppressSizeToFit: false,
                    valueGetter: (params: any) => {
                        return getPersonStatus(params.data || {});
                    }
                },
                {
                    headerName: "Roles",
                    filter: "agTextColumnFilter",
                    flex: 2,
                    minWidth: 200,
                    suppressSizeToFit: false,
                    valueGetter: (params: any) => {
                        return formatRoles(params.data?.organizations || []);
                    }
                }
            ],
            rowData: [],
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
                floatingFilter: false
            },
            pagination: true,
            paginationPageSize: 20,
            paginationPageSizeSelector: [10, 20, 50, 100],
            suppressScrollOnNewData: true,
            overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No persons to display</span>',
            domLayout: 'normal',
            onGridReady: (params) => {
                gridApi = params.api;
                gridApi.setGridOption("loading", true);
                // Force column visibility
                setTimeout(() => {
                    if (gridApi) {
                        gridApi.sizeColumnsToFit();
                    }
                }, 100);
            }
        };

        gridApi = createGrid(gridElement as HTMLElement, gridOptions);
        // Don't fetch persons here - let the $effect handle it when user is authenticated
    });

    onDestroy(() => {
        // Cleanup handled by Svelte's reactive system
    });

    function onDeleteClick(personData: any) {
        objectToDelete = personData;
        if (objectToDelete) {
            deleteDialogOpen = true;
        }
    }

    function onEditClick(personData: any) {
        editObject("person", personData);
        fetchPersons();
    }

    function onPersonChanged() {
        fetchPersons();
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@33.3.4/styles/ag-grid.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@33.3.4/styles/ag-theme-quartz.min.css" />
</svelte:head>

<div class="grid-toolbar">
  <div class="left-side">
    <button type="button" class="standard-button primary inverted" onclick={() => addObject("person")} aria-label="Add Person">
      <IconPlus size="16" />Add Person
    </button>
    <div class="search-container">
        <input type="text" placeholder="Quick filter..." class="quick-input-field" value={filterValue} oninput={onGlobalFilter} />
        {#if filterValue}
            <button type="button" class="clear-search-button" onclick={clearSearch}>×</button>
        {/if}
    </div>
    <button type="button" class="grid-button green-button" onclick={refreshPersons} title="Refresh" aria-label="Refresh">
        <IconRefresh size={16} />
    </button>
  </div>
</div>

<div id="personGrid" class="{gridTheme} ag-grid"></div>

<DeleteObjectDialog
    open={deleteDialogOpen}
    objectType="person"
    object={objectToDelete}
    on:delete={() => {
        onPersonChanged();
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
    on:cancel={() => {
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
/>



