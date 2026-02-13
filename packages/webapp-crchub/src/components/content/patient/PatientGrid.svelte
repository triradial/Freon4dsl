<script lang="ts">
    import { dataStore } from "../../../services/data/data-store.js";
    import { editObject, addObject } from "../../../services/stores/object-drawer-store.js";
    import { onMount, onDestroy, tick } from "svelte";
    import { mount, unmount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import { goto } from '$app/navigation';
    import { navigateTo } from "../../../services/routing/route-action.js";
    import { theme } from "../../../services/stores/theme-store.js";
    import DeleteObjectDialog from "../../dialogs/DeleteObjectDialog.svelte";
    import SaveViewDialog from "../../dialogs/SaveViewDialog.svelte";
    // @ts-ignore
    import { Plus as IconPlus, RefreshCcw as IconRefresh, EllipsisVertical as IconEllipsisVertical } from '@lucide/svelte';
    import type { SelectOption } from '@freon4dsl/core';
    import ConfirmUnsavedDialog from '../../dialogs/ConfirmUnsavedDialog.svelte';
    import PatientNameCell from "./PatientNameCell.svelte";

    const { studyId } = $props<{ studyId: string }>();

    let deleteDialogOpen = $state(false);
    let objectToDelete = $state<any>(null);

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let patientsData = $derived($dataStore.studyPatients);
    let canManageStudies = true;
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");
    
    let updateTimeout: any = null;
    
    // LocalStorage key for saving column state
    const PATIENTS_COLUMN_STATE_KEY = "crchub-patients-column-state";
    const PATIENTS_VIEW_KEY = "crchub-patients-view";
    const ACTIVE_VIEW_KEY = "crchub-patients-active-view";
    
    // Reactive variable to track if there's saved state
    let hasSavedState = $state(false);
    let selectedView = $state("default");

    // Stores the column configuration that represents the default view
    let defaultColumnState: any[] = [];
    // Keeps the column state of the currently applied non-custom view so we can detect real changes
    let referenceViewState: any[] = [];

    // Flag to suppress saveColumnState reactions while programmatically applying a view
    let isApplyingView = false;
    
    // Predefined views
    const predefinedViews: SelectOption[] = [
        { id: "default", label: "Default" }
    ];

    const SAVED_VIEWS_KEY = "crchub-patients-saved-views";

    // Helper to load previously saved named views
    function loadSavedViews(): any[] {
        const raw = localStorage.getItem(SAVED_VIEWS_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    // Saved views loaded at start
    let savedViews: any[] = loadSavedViews();

    // Mutable list so we can push saved views
    let viewOptions = $state<SelectOption[]>([
        ...predefinedViews,
        ...savedViews.map(v => ({ id: v.id, label: v.label }))
    ]);

    // The currently selected option object for the dropdown
    let selectedViewOption = $state<SelectOption>(predefinedViews[0]);
    let showMenu = $state(false);
    let menuAnchor: HTMLElement | null = null;
    let hasUnsavedChanges = $state(false);
    let menuRef = $state<HTMLDivElement | null>(null);

    // Retrieve previously active view from sessionStorage (applied after grid ready)
    let initialActiveView: string | null = sessionStorage.getItem(ACTIVE_VIEW_KEY);

    // Dialog state
    let saveDialogOpen = $state(false);
    
    let confirmUnsavedOpen = $state(false);
    let pendingViewChange: string | null = null;
    
    // Quick filter state
    let filterValue = $state("");

    $effect(() => {
        // keep the gridApi and patientsData in scope
        void gridApi;
        void patientsData;
        if (gridApi && patientsData) {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                gridApi.setGridOption("rowData", patientsData);
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
                // Hide loading overlay after data is set
                gridApi.setGridOption("loading", false);
            }, 100);
        }
    });

    async function fetchPatients() {
        if (gridApi) gridApi.setGridOption("loading", true);
        await dataStore.getStudyPatients(studyId);
        // Do not set loading to false here; let the debounced effect handle it after data is set
    }

    function updateGridData() {
        if (gridApi && patientsData) {
            gridApi.setGridOption("rowData", patientsData);
            setTimeout(() => {
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
                if (patientsData.length === 0) {
                    gridApi.setGridOption("loading", false);
                }
            }, 100);
        }
    }

    // Save column state to localStorage
    function saveColumnState() {
        // Ignore events during predefined view application
        if (isApplyingView) return;

        const columnState = gridApi.getColumnState();

        // If current view is not "custom", compare with referenceViewState
        if (selectedView !== "default" && referenceViewState.length > 0) {
            if (stateEquals(columnState, referenceViewState)) {
                // Still same as the selected view, nothing to do
                hasUnsavedChanges = false;
                return;
            }
        }

        // Determine if current state equals default (for safety)
        const isDefault = columnState.every(col => !col.hide && !col.pinned && !col.sort);
        if (isDefault && selectedView === "default") {
            hasUnsavedChanges = false;
            referenceViewState = defaultColumnState;
            return;
        }

        hasUnsavedChanges = true;
    }


    // Apply a predefined view
    function applyView(viewValue) {
        if (!gridApi) return;

        // Handle 'custom' specially: keep current grid state intact
        const savedStateRaw = localStorage.getItem(`${PATIENTS_COLUMN_STATE_KEY}-${viewValue}`);
        if (savedStateRaw) {
            const savedState = JSON.parse(savedStateRaw);
            isApplyingView = true;
            gridApi.applyColumnState({ state: savedState, applyOrder: true });
            selectedView = viewValue;
            referenceViewState = savedState;
            hasUnsavedChanges = false;
            sessionStorage.setItem(ACTIVE_VIEW_KEY, viewValue);
            setTimeout(() => { isApplyingView = false; }, 100);
            return;
        }

        // Default view
        isApplyingView = true;
        const resetState = gridApi.getColumnState().map(col => ({
            colId: col.colId,
            sort: null,
            sortIndex: null,
            hide: false,
            pinned: null
        }));
        gridApi.applyColumnState({ state: resetState, applyOrder: true });
        defaultColumnState = resetState;
        referenceViewState = resetState;
        selectedView = viewValue;
        localStorage.setItem(PATIENTS_VIEW_KEY, viewValue);
        sessionStorage.setItem(ACTIVE_VIEW_KEY, viewValue);
        hasUnsavedChanges = false;
        setTimeout(() => {
            isApplyingView = false;
        }, 100);
    }

    // Handle save dialog confirmation
    async function handleSaveView(event) {
        const viewName: string = event.detail;
        if (!gridApi || !viewName) return;

        const columnState = gridApi.getColumnState();

        // Retrieve existing saved views
        savedViews = loadSavedViews();

        const id = viewName.toLowerCase().replace(/\s+/g, "-");
        const newViewMeta = { id, label: viewName, state: columnState };
        savedViews.push(newViewMeta);
        localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));

        // Persist column state under KEY specific to this view as well
        localStorage.setItem(`${PATIENTS_COLUMN_STATE_KEY}-${id}`, JSON.stringify(columnState));

        // update dropdown options
        viewOptions = [...predefinedViews, ...savedViews.map(v => ({ id: v.id, label: v.label }))];

        // Wait for DOM to update with new option before selecting
        await tick();

        selectedView = id;
        selectedViewOption = viewOptions.find(v => v.id === id) as any;

        // Programmatically apply the saved view
        applyView(id);

        // Reload page so dropdown is fresh and grid re-inits with new view
        location.reload();

        referenceViewState = columnState;
        hasUnsavedChanges = false;
        saveDialogOpen = false;
    }

    function handleCancelSaveView() {
        saveDialogOpen = false;
    }

    // Add menu logic
    function openMenu(event) {
        if (showMenu) {
            closeMenu();
        } else {
            menuAnchor = event.currentTarget;
            showMenu = true;
        }
    }
    function closeMenu() {
        showMenu = false;
    }
    async function handleSave() {
        if (!gridApi || selectedView === "default") return;
        const columnState = gridApi.getColumnState();
        localStorage.setItem(`${PATIENTS_COLUMN_STATE_KEY}-${selectedView}`, JSON.stringify(columnState));
        // Update savedViews
        savedViews = loadSavedViews();
        const idx = savedViews.findIndex(v => v.id === selectedView);
        if (idx !== -1) {
            savedViews[idx].state = columnState;
            localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));
        }
        referenceViewState = columnState;
        hasUnsavedChanges = false;
        closeMenu();
    }
    async function handleSaveAs() {
        saveDialogOpen = true;
        closeMenu();
    }
    async function handleDelete() {
        if (selectedView === "default") return;
        // Remove from savedViews
        savedViews = loadSavedViews().filter(v => v.id !== selectedView);
        localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));
        localStorage.removeItem(`${PATIENTS_COLUMN_STATE_KEY}-${selectedView}`);
        // Update viewOptions
        viewOptions = [...predefinedViews, ...savedViews.map(v => ({ id: v.id, label: v.label }))];
        selectedView = "default";
        applyView("default");
        closeMenu();
    }

    // Get initial column definitions with saved state applied
    function getColumnDefs() {
        const baseColumnDefs = [
            {
                field: "id",
                headerName: "Patient ID",
                minWidth: 300,
                maxWidth: 400,
                filter: false,
                hide: true,
                cellRenderer: (params: any) => {
                    return params.value || '';
                },
            },
            {
                field: "patientNumber",
                headerName: "Number",
                minWidth: 200,
                filter: false, // Remove column filter
                cellRenderer: (params: any) => {
                    return createNameCell(params);
                },
            },
            {
                field: "initials",
                headerName: "Initials",
                filter: "agTextColumnFilter",
            },
            {
                field: "dob",
                headerName: "YOB",
                filter: "agTextColumnFilter",
            },
            {
                field: "gender",
                filter: "agTextColumnFilter",
            }
        ];

        // Check if we have a saved view preference
        const savedView = localStorage.getItem(PATIENTS_VIEW_KEY);
        if (savedView && savedView !== "default") {
            selectedView = savedView;
        }
        
        // Apply saved custom state if available
        try {
            const savedState = localStorage.getItem(PATIENTS_COLUMN_STATE_KEY);
            if (savedState) {
                const columnState = JSON.parse(savedState);
                console.log("[PatientGrid] Applying saved state to column definitions:", columnState);
                
                // Apply saved properties to matching columns
                columnState.forEach((savedCol: any) => {
                    const baseCol = baseColumnDefs.find(col => col.field === savedCol.colId);
                    if (baseCol) {
                        // Apply column visibility
                        if (savedCol.hide) {
                            (baseCol as any).hide = true;
                        }
                        // Apply column width
                        if (savedCol.width) {
                            (baseCol as any).width = savedCol.width;
                        }
                        // Apply column pinning
                        if (savedCol.pinned) {
                            (baseCol as any).pinned = savedCol.pinned;
                        }
                        // Apply sorting
                        if (savedCol.sort) {
                            (baseCol as any).sort = savedCol.sort;
                            if (typeof savedCol.sortIndex === 'number') {
                                (baseCol as any).sortIndex = savedCol.sortIndex;
                            }
                        }
                    }
                });
                
                hasSavedState = true;
                referenceViewState = columnState;
            }
        } catch (error) {
            console.warn("[PatientGrid] Failed to apply saved state to column definitions:", error);
        }

        return baseColumnDefs;
    }

    onMount(async () => {
        // Initialize saved state indicator
        hasSavedState = localStorage.getItem(PATIENTS_COLUMN_STATE_KEY) !== null;
        
        // Initialize selected view
        const savedView = localStorage.getItem(PATIENTS_VIEW_KEY);
        // Override selectedView with previously active one if present in session and exists in options
        if (initialActiveView && viewOptions.find(v => v.id === initialActiveView)) {
            selectedView = initialActiveView;
        } else if (savedView && viewOptions.find(v => v.id === savedView)) {
            selectedView = savedView;
            // Find the option that matches the selectedView, including saved views
            const foundOption = viewOptions.find(v => v.id === savedView) || viewOptions[0];
            selectedViewOption = foundOption;
        }
        
        await fetchPatients();
        gridOptions = {
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
            },
            autoSizeStrategy: {
                type: "fitCellContents",
            },
            columnDefs: getColumnDefs(),
            onGridReady: (params) => {
                if (patientsData.length > 0) {
                    updateGridData();
                } else {
                    gridApi.setGridOption("loading", false);
                }

                // Apply the stored active view if it isn't default and grid is ready
                if (initialActiveView && initialActiveView !== "default" && initialActiveView !== "custom") {
                    applyView(initialActiveView);
                }
            },
            // Save column state when columns change
            onColumnVisible: () => {
                saveColumnState();
            },
            onColumnPinned: () => {
                saveColumnState();
            },
            onColumnResized: () => {
                saveColumnState();
            },
            onColumnMoved: () => {
                saveColumnState();
            },
            onSortChanged: () => {
                saveColumnState();
            },
        };

        const gridElement = document.querySelector("#patientGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);

        // Capture the default column state after grid is initialized
        defaultColumnState = gridApi.getColumnState();
        referenceViewState = defaultColumnState; // Initialize referenceViewState for default view

        gridElement.addEventListener("click", (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === "A") {
                event.preventDefault();
                const patientId = target.getAttribute("data-patient-id");
                if (patientId) {
                    onOpenClick(patientId);
                }
            }
        });
    });

    onDestroy(() => {
        // Cleanup all mounted cell renderer components
        cellRendererInstances.forEach((value, element) => {
            try {
                if (value.component) {
                    unmount(value.component);
                } else {
                    // Handle old format where value is the component directly
                    unmount(value);
                }
            } catch (e) {
                console.warn('Error unmounting cell renderer:', e);
            }
        });
        cellRendererInstances.clear();
    });

    function onOpenClick(patientId: string) {
        // Pass studyId context when navigating to patient
        const url = studyId 
            ? `/patient?id=${patientId}&studyId=${studyId}`
            : `/patient?id=${patientId}`;
        goto(url);
    }

    function onDeleteClick(patientData: any) {
        console.log("Delete clicked for patient:", patientData);
        objectToDelete = patientData;
        if (objectToDelete) {
            deleteDialogOpen = true;
        }
    }

    function onEditClick(patientData: any) {
        editObject("patient", patientData);
        fetchPatients();
    }

    function onPatientChanged() {
        fetchPatients();
    }

    // Store component instances for cleanup
    const cellRendererInstances = new Map<HTMLElement, any>();

    function createNameCell(params: any) {
        // Create a temporary container for mounting
        const tempContainer = document.createElement("div");
        
        // Mount Svelte component - it creates its root element inside tempContainer
        const component = mount(PatientNameCell, {
            target: tempContainer,
            props: {
                params: params,
                studyId: studyId, // Pass studyId from grid context
                onEdit: onEditClick,
                onDelete: onDeleteClick
            }
        });
        
        // Get the actual root element created by the component (first child)
        const rootElement = tempContainer.firstElementChild as HTMLElement;
        
        if (!rootElement) {
            // Fallback: return container with text if component didn't render
            tempContainer.textContent = params.data?.patientNumber || '';
            return tempContainer;
        }
        
        // Store component for cleanup
        cellRendererInstances.set(rootElement, { component, tempContainer });
        
        // Return the component's root element directly
        return rootElement;
    }

    async function refreshPatients() {
        console.log("Refreshing patients");
        if (gridApi) gridApi.setGridOption("loading", true);
        await dataStore.getStudyPatients(studyId);
        // updateGridData() is not needed; debounced effect will handle
    }

    function onGlobalFilter(event: Event) {
        const target = event.target as HTMLInputElement;
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

    function stateEquals(a: any[], b: any[]): boolean {
        if (!a || !b || a.length !== b.length) return false;
        const mapB = new Map(b.map(col => [col.colId, col]));
        for (const colA of a) {
            const colB = mapB.get(colA.colId);
            if (!colB) return false;
            const props = ["sort", "sortIndex", "hide", "pinned"];
            for (const p of props) {
                if ((colA as any)[p] !== (colB as any)[p]) return false;
            }
        }
        return true;
    }

    function onViewSelect(event) {
        const newView = event.target.value;
        if (hasUnsavedChanges) {
            pendingViewChange = newView;
            confirmUnsavedOpen = true;
        } else {
            applyView(newView);
            refreshPatients();
        }
    }

    function handleConfirmSave() {
        if (pendingViewChange) {
            if (selectedView === 'default') {
                // Save as new view
                saveDialogOpen = true;
            } else {
                // Save current view
                handleSave();
                applyView(pendingViewChange);
                refreshPatients();
            }
        }
        confirmUnsavedOpen = false;
        pendingViewChange = null;
    }

    function handleConfirmDiscard() {
        if (pendingViewChange) {
            applyView(pendingViewChange);
            refreshPatients();
        }
        confirmUnsavedOpen = false;
        pendingViewChange = null;
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
</svelte:head>

<div class="grid-toolbar">
  <div class="left-side">
    <button type="button" class="standard-button primary inverted" onclick={() => addObject("patient", studyId)} aria-label="Add Patient">
      <IconPlus size="16" />Add Patient
    </button>
    <div class="search-container">
        <input type="text" placeholder="Quick filter..." class="quick-input-field" value={filterValue} oninput={onGlobalFilter} />
        {#if filterValue}
            <button type="button" class="clear-search-button" onclick={clearSearch}>×</button>
        {/if}
    </div>
    <button type="button" class="grid-button green-button" onclick={refreshPatients} title="Refresh" aria-label="Refresh">
        <IconRefresh size={16} />
    </button>
  </div>
  <div class="right-side">
    <div class="view-controls" style="position: relative; display: inline-block;">
      <select id="view-select" bind:value={selectedView} onchange={onViewSelect} class="view-select">
        {#each viewOptions as option}
          <option value={option.id}>{option.label}</option>
        {/each}
      </select>
      <button type="button" class="icon-button save-view-button" onclick={openMenu} disabled={selectedView === 'default' && !hasUnsavedChanges} title="View options">
        <IconEllipsisVertical size={18} />
      </button>
    </div>
    {#if showMenu}
      <div bind:this={menuRef} class="menu-popup-dropdown">
        {#if selectedView !== 'default'}
          <button class="menu-item" onclick={handleSave}>Save</button>
          <button class="menu-item" onclick={handleSaveAs}>Save As</button>
          <button class="menu-item" onclick={handleDelete}>Delete</button>
        {:else if hasUnsavedChanges}
          <button class="menu-item" onclick={handleSaveAs}>Save As</button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<div id="patientGrid" class="{gridTheme} ag-grid"></div>

<DeleteObjectDialog
    open={deleteDialogOpen}
    objectType="patient"
    object={objectToDelete}
    on:delete={() => {
        onPatientChanged();
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
    on:cancel={() => {
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
/>
<SaveViewDialog
    open={saveDialogOpen}
    onsave={handleSaveView}
    oncancel={handleCancelSaveView}
/>
<ConfirmUnsavedDialog
    open={confirmUnsavedOpen}
    on:save={handleConfirmSave}
    on:discard={handleConfirmDiscard}
/>

<style>
.menu-popup-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 10px;
    margin-right: 4px;
    background: var(--dropdown-bg, #23272f);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    z-index: 1000;
    transform: translateY(4px);
}
.menu-item {
    background: none;
    border: none;
    color: var(--dropdown-fg, #fff);
    text-align: left;
    padding: 10px 20px;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.15s;
}
.menu-item:hover {
    background: var(--dropdown-hover, #2a2e38);
}
.save-view-button {
    background: var(--button-bg, #2a2e38);
    color: var(--button-fg, #fff);
    border: 1px solid var(--button-border, #3a3f4b);
    border-radius: 6px;
    padding: 6px 12px;
    font-weight: 500;
    transition: background 0.15s, color 0.15s, border 0.15s;
}
.save-view-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
.save-view-button:hover:not(:disabled), .save-view-button:focus:not(:disabled) {
    background: var(--button-hover-bg, #3a3f4b);
    color: var(--button-hover-fg, #fff);
    border-color: var(--button-hover-border, #4a4f5b);
}
</style>

