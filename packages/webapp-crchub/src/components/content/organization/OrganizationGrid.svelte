<script lang="ts">
    import { dataStore } from "../../../services/data/data-store.js";
    import { editObject, addObject } from "../../../services/stores/object-drawer-store.js";
    import { onMount, onDestroy } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { theme } from "../../../services/stores/theme-store.js";
    import DeleteObjectDialog from "../../dialogs/DeleteObjectDialog.svelte";
    import { userStore } from "../../../services/stores/users-store.js";
    // @ts-ignore
    import { Plus as IconPlus, RefreshCcw as IconRefresh } from '@lucide/svelte';

    let deleteDialogOpen = $state(false);
    let objectToDelete = $state<any>(null);

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let organizationsData = $derived($dataStore.organizations);
    let user = $state<any>(null);
    let showGrid = $derived(!!user);
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");
    let hasFetched = $state(false);

    let updateTimeout: any = null;
    let userUnsubscribe;
    let filterValue = $state("");

    $effect(() => {
        void gridApi;
        void organizationsData;
        console.log("[OrganizationGrid] Effect triggered - organizationsData:", organizationsData);
        if (gridApi && organizationsData) {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                console.log("[OrganizationGrid] Setting rowData:", organizationsData);
                gridApi.setGridOption("rowData", organizationsData);
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
                gridApi.setGridOption("loading", false);
            }, 100);
        }
    });

    async function fetchOrganizations() {
        console.log("[OrganizationGrid] fetchOrganizations called");
        if (gridApi) gridApi.setGridOption("loading", true);
        const result = await dataStore.getOrganizations();
        console.log("[OrganizationGrid] getOrganizations result:", result);
    }

    $effect(() => {
        console.log("[OrganizationGrid] User effect - user:", user, "hasFetched:", hasFetched, "dataLength:", organizationsData.length);
        if (user && !hasFetched) {
            hasFetched = true;
            console.log("[OrganizationGrid] Fetching organizations for user:", user.userid);
            fetchOrganizations();
        }
    });

    function refreshOrganizations() {
        fetchOrganizations();
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
        container.className = "organization-name-cell-container";
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
        editButton.title = "Edit Organization";
        editButton.onclick = (e) => {
            e.stopPropagation();
            onEditClick(params.data);
        };
        
        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = getSVGIcon("trash");
        deleteButton.className = "grid-button delete-button";
        deleteButton.title = "Delete Organization";
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

    onMount(() => {
        userUnsubscribe = userStore.subscribe((value) => {
            console.log("[OrganizationGrid] User subscription update:", value);
            user = value;
        });

        const gridElement = document.querySelector("#organizationGrid");
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
                    field: "orgTypeName",
                    headerName: "Type",
                    filter: "agTextColumnFilter",
                    flex: 1,
                    minWidth: 150,
                    suppressSizeToFit: false
                },
                {
                    field: "orgSubtypeName",
                    headerName: "Subtype",
                    filter: "agTextColumnFilter",
                    flex: 1,
                    minWidth: 150,
                    suppressSizeToFit: false
                },
                {
                    field: "personCount",
                    headerName: "Persons",
                    filter: "agNumberColumnFilter",
                    flex: 1,
                    minWidth: 100,
                    suppressSizeToFit: false,
                    cellRenderer: (params: any) => {
                        const count = params.value;
                        return count && count > 0 ? count : '';
                    }
                },
                {
                    field: "startDate",
                    headerName: "Start Date",
                    filter: "agDateColumnFilter",
                    flex: 1,
                    minWidth: 120,
                    suppressSizeToFit: false,
                    cellRenderer: (params: any) => {
                        if (!params.value) return '';
                        // Format date for display (YYYY-MM-DD -> 26-Nov-2025)
                        const dateMatch = params.value.match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (dateMatch) {
                            const [, year, month, day] = dateMatch;
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const monthIndex = parseInt(month, 10) - 1;
                            const monthName = monthNames[monthIndex] || month;
                            // Remove leading zero from day
                            const dayNum = parseInt(day, 10);
                            return `${dayNum}-${monthName}-${year}`;
                        }
                        return params.value;
                    }
                },
                {
                    field: "endDate",
                    headerName: "End Date",
                    filter: "agDateColumnFilter",
                    flex: 1,
                    minWidth: 120,
                    suppressSizeToFit: false,
                    cellRenderer: (params: any) => {
                        if (!params.value) return '';
                        // Format date for display (YYYY-MM-DD -> 26-Nov-2025)
                        const dateMatch = params.value.match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (dateMatch) {
                            const [, year, month, day] = dateMatch;
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const monthIndex = parseInt(month, 10) - 1;
                            const monthName = monthNames[monthIndex] || month;
                            // Remove leading zero from day
                            const dayNum = parseInt(day, 10);
                            return `${dayNum}-${monthName}-${year}`;
                        }
                        return params.value;
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
            enableRangeSelection: true,
            enableCharts: true,
            rowGroupPanelShow: "always",
            pagination: true,
            paginationPageSize: 20,
            paginationPageSizeSelector: [10, 20, 50, 100],
            suppressScrollOnNewData: true,
            overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No organizations to display</span>',
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
        fetchOrganizations();
    });

    onDestroy(() => {
        if (userUnsubscribe) userUnsubscribe();
    });

    function onDeleteClick(organizationData: any) {
        objectToDelete = organizationData;
        if (objectToDelete) {
            deleteDialogOpen = true;
        }
    }

    function onEditClick(organizationData: any) {
        editObject("organization", organizationData);
        fetchOrganizations();
    }

    function onOrganizationChanged() {
        fetchOrganizations();
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@33.3.4/styles/ag-grid.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@33.3.4/styles/ag-theme-quartz.min.css" />
</svelte:head>

<div class="grid-toolbar">
  <div class="left-side">
    <button type="button" class="standard-button primary inverted" onclick={() => addObject("organization")} aria-label="Add Organization">
      <IconPlus size="16" />Add Organization
    </button>
    <div class="search-container">
        <input type="text" placeholder="Quick filter..." class="quick-input-field" value={filterValue} oninput={onGlobalFilter} />
        {#if filterValue}
            <button type="button" class="clear-search-button" onclick={clearSearch}>×</button>
        {/if}
    </div>
    <button type="button" class="grid-button green-button" onclick={refreshOrganizations} title="Refresh" aria-label="Refresh">
        <IconRefresh size={16} />
    </button>
  </div>
</div>

<div id="organizationGrid" class="{gridTheme} ag-grid"></div>

<DeleteObjectDialog
    open={deleteDialogOpen}
    objectType="organization"
    objectData={objectToDelete}
    onClose={() => { deleteDialogOpen = false; objectToDelete = null; }}
    onDeleted={onOrganizationChanged}
/>



