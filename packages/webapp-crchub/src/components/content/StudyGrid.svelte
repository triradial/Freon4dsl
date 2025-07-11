<script lang="ts">
    import { dataStore } from "../../services/data/data-store.js";
    import { editObject, addObject } from "../../services/stores/object-drawer-store.js";
    import { onMount, onDestroy } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { navigateTo } from "../../services/routing/route-action.js";
    import { theme } from "../../services/stores/theme-store.js";
    import GridHeader from "../common/GridHeader.svelte";
    import { getSVGIcon } from "../../services/utils.js";
    import DeleteObjectDialog from "../dialogs/DeleteObjectDialog.svelte";
    import { userStore } from "../../services/stores/users-store.js";
    // @ts-ignore
    import { Plus as IconPlus, RefreshCcw as IconRefresh } from '@lucide/svelte';
    import type { SelectOption } from '@freon4dsl/core';

    let deleteDialogOpen = $state(false);
    let objectToDelete = $state<any>(null);

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let studiesData = $derived($dataStore.studies);
    let user = null;
    let showGrid = $derived(!!user);
    let canManageStudies = true;
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");
    let hasFetched = $state(false);

    let updateTimeout: any = null;
    let userUnsubscribe;
    
    // LocalStorage key for saving column state
    const STUDIES_COLUMN_STATE_KEY = "crchub-studies-column-state";
    const STUDIES_VIEW_KEY = "crchub-studies-view";
    
    // Reactive variable to track if there's saved state
    let hasSavedState = $state(false);
    let hasCustomGrouping = $state(false);
    let selectedView = $state("default");
    
    // Predefined views
    const viewOptions: SelectOption[] = [
        { id: "default", label: "Default (No Grouping)" },
        { id: "phase", label: "Group by Phase" },
        { id: "status", label: "Group by Status" },
        { id: "therapeuticArea", label: "Group by Therapeutic Area" }
    ];
    
    let selectedViewOption = $state<SelectOption>(viewOptions[0]);

    $effect(() => {
        // keep the gridApi and studiesData in scope
        void gridApi;
        void studiesData;
        if (gridApi && studiesData) {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                gridApi.setGridOption("rowData", studiesData);
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
                // Hide loading overlay after data is set
                gridApi.setGridOption("loading", false);
            }, 100);
        }
    });

    async function fetchStudies() {
        if (gridApi) gridApi.setGridOption("loading", true);
        await dataStore.getStudies();
        // Do not set loading to false here; let the debounced effect handle it after data is set
    }

    $effect(() => {
        if (user && studiesData.length === 0 && !hasFetched) {
            hasFetched = true;
            fetchStudies();
        }
    });

    function updateGridData() {
        if (gridApi && studiesData) {
            gridApi.setGridOption("rowData", studiesData);
            setTimeout(() => {
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
                if (studiesData.length === 0) {
                    gridApi.setGridOption("loading", false);
                }
            }, 100);
        }
    }

    // Save column state to localStorage
    function saveColumnState() {
        if (gridApi) {
            const columnState = gridApi.getColumnState();
            localStorage.setItem(STUDIES_COLUMN_STATE_KEY, JSON.stringify(columnState));
            
            // Check if there's custom grouping (user manually grouped columns)
            const hasGrouping = columnState.some(col => col.rowGroup && !isPredefinedView(columnState));
            hasCustomGrouping = hasGrouping;
            hasSavedState = hasGrouping;
            
            console.log("[StudyGrid] Column state saved to localStorage:", columnState);
        }
    }

    // Check if current grouping matches any predefined view
    function isPredefinedView(columnState) {
        for (const view of viewOptions) {
            if (view.id === "default") continue;
            
            const expectedGrouping = getGroupingForView(view.id);
            const actualGrouping = columnState.filter(col => col.rowGroup).map(col => col.colId);
            
            if (actualGrouping.length === expectedGrouping.length &&
                actualGrouping.every(col => expectedGrouping.includes(col))) {
                return true;
            }
        }
        return false;
    }

    // Get grouping configuration for a view
    function getGroupingForView(viewValue) {
        switch (viewValue) {
            case "phase":
                return ["phase"];
            case "status":
                return ["status"];
            case "therapeuticArea":
                return ["therapeuticArea"];
            default:
                return [];
        }
    }

    // Apply a predefined view
    function applyView(viewValue) {
        if (!gridApi) return;
        
        // First, clear all row grouping
        gridApi.applyColumnState({
            state: gridApi.getColumnState().map(col => ({
                ...col,
                rowGroup: false,
                rowGroupIndex: null
            }))
        });
        
        // Apply the selected view's grouping
        const groupingFields = getGroupingForView(viewValue);
        if (groupingFields.length > 0) {
            const columnState = gridApi.getColumnState();
            const newColumnState = columnState.map(col => {
                const groupIndex = groupingFields.indexOf(col.colId);
                return {
                    ...col,
                    rowGroup: groupIndex !== -1,
                    rowGroupIndex: groupIndex !== -1 ? groupIndex : null
                };
            });
            gridApi.applyColumnState({
                state: newColumnState
            });
        }
        
        // Save the view preference
        selectedView = viewValue;
        localStorage.setItem(STUDIES_VIEW_KEY, viewValue);
        
        // Reset custom grouping flag since this is a predefined view
        hasCustomGrouping = false;
        hasSavedState = false;
        
    }

    // Save current grouping as custom view
    function saveCustomView() {
        if (gridApi) {
            const columnState = gridApi.getColumnState();
            localStorage.setItem(STUDIES_COLUMN_STATE_KEY, JSON.stringify(columnState));
            hasCustomGrouping = false;
            hasSavedState = true;
            console.log("[StudyGrid] Custom view saved");
        }
    }

    // Clear saved column state
    function clearSavedColumnState() {
        localStorage.removeItem(STUDIES_COLUMN_STATE_KEY);
        hasSavedState = false;
        console.log("[StudyGrid] Saved column state cleared");
    }



    // Get initial column definitions with saved state applied
    function getColumnDefs() {
        const baseColumnDefs = [
            {
                field: "name",
                tooltipField: "title",
                cellRenderer: (params: any) => {
                    return createNameCell(params);
                },
            },
            {
                field: "phase",
                enableRowGroup: true,
                resizable: false,
            },
            {
                field: "status",
                enableRowGroup: true,
                filter: "agSetColumnFilter",
                filterParams: {
                    excelMode: "mac",
                },
            },
            {
                field: "therapeuticArea",
                headerName: "Therapeutic Area",
                enableRowGroup: true,
                filter: "agSetColumnFilter",
                filterParams: {
                    excelMode: "mac",
                },
            }
        ];

        // Check if we have a saved view preference
        const savedView = localStorage.getItem(STUDIES_VIEW_KEY);
        if (savedView && savedView !== "default") {
            // Apply predefined view
            const groupingFields = getGroupingForView(savedView);
            groupingFields.forEach((field, index) => {
                const baseCol = baseColumnDefs.find(col => col.field === field);
                if (baseCol) {
                    (baseCol as any).rowGroup = true;
                    (baseCol as any).rowGroupIndex = index;
                }
            });
            selectedView = savedView;
        } else {
            // Apply saved custom state if no predefined view
            try {
                const savedState = localStorage.getItem(STUDIES_COLUMN_STATE_KEY);
                if (savedState) {
                    const columnState = JSON.parse(savedState);
                    console.log("[StudyGrid] Applying saved state to column definitions:", columnState);
                    
                    // Apply saved properties to matching columns
                    columnState.forEach((savedCol: any) => {
                        const baseCol = baseColumnDefs.find(col => col.field === savedCol.colId);
                        if (baseCol) {
                            // Apply row grouping
                            if (savedCol.rowGroup) {
                                (baseCol as any).rowGroup = true;
                                if (typeof savedCol.rowGroupIndex === 'number') {
                                    (baseCol as any).rowGroupIndex = savedCol.rowGroupIndex;
                                }
                            }
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
                }
            } catch (error) {
                console.warn("[StudyGrid] Failed to apply saved state to column definitions:", error);
            }
        }

        return baseColumnDefs;
    }



    onMount(() => {
        // Initialize saved state indicator
        hasSavedState = localStorage.getItem(STUDIES_COLUMN_STATE_KEY) !== null;
        
        // Initialize selected view
        const savedView = localStorage.getItem(STUDIES_VIEW_KEY);
        if (savedView && viewOptions.find(v => v.id === savedView)) {
            selectedView = savedView;
            selectedViewOption = viewOptions.find(v => v.id === savedView) || viewOptions[0];
        }
        
        userUnsubscribe = userStore.subscribe((val) => {
            user = val;
            console.debug('[StudyGrid] userStore subscription: user set to', user);
        });
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
            groupDisplayType: "groupRows",
            rowGroupPanelShow: "always",
            onGridReady: (params) => {
                if (studiesData.length > 0) {
                    updateGridData();
                } else {
                    gridApi.setGridOption("loading", false);
                }
            },
            // Save column state when columns change
            onColumnRowGroupChanged: () => {
                saveColumnState();
            },
            onColumnPivotChanged: () => {
                saveColumnState();
            },
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

        const gridElement = document.querySelector("#studyGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);

        gridElement.addEventListener("click", (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === "A") {
                event.preventDefault();
                const studyId = target.getAttribute("data-study-id");
                if (studyId) {
                    onOpenClick(studyId);
                }
            }
        });
    });

    onDestroy(() => {
        if (userUnsubscribe) userUnsubscribe();
    });

    function onOpenClick(studyId: string) {
        navigateTo("study", studyId);
    }

    function onDeleteClick(studyId: string) {
        console.log("Delete clicked for study:", studyId);
        objectToDelete = studiesData.find((s) => s.id === studyId);
        if (objectToDelete) {
            deleteDialogOpen = true;
        }
    }

    function onEditClick(studyId: string) {
        editObject("study", studyId);
        fetchStudies();
    }

    function onStudyChanged() {
        fetchStudies();
    }

    function createNameCell(params: any) {
        const name = `<a href="#" data-study-id="${params.data.id}">${params.data.name}</a>`;
        //const projects = params.data.projects;
        const span = document.createElement("span");
        span.classList.add("grid-cell");
        span.innerHTML = name;

        const buttonConfigs = [
        {
            type: "edit",
            icon: "edit",
            level: "primary",
            onClick: onEditClick,
            isVisible: () => {
                return canManageStudies;
            },
        },
        {
            type: "delete",
            icon: "delete",
            level: "primary",
            onClick: onDeleteClick,
            isVisible: () => {
                return canManageStudies;
            },
        },
        ];

        // Filter buttons based on visibility rules
        const visibleButtons = buttonConfigs.filter((btn) => btn.isVisible());
        // Only create button group if there are visible buttons
        if (visibleButtons.length > 0) {
            const buttonGroup = document.createElement("span");
            buttonGroup.classList.add("grid-button-group");
            addActionButtons(buttonGroup, params, visibleButtons);
            span.appendChild(buttonGroup);
        }
        return span;
    }

    function addActionButtons(span: any, params: any, buttonConfigs: any) {
        buttonConfigs.forEach((config: any) => {
            const button = document.createElement("button");
            button.classList.add("icon-button", `${config.level}`, "inverted");
            // button.setAttribute("data-testid", `study-name-${params.data.code}`);
            button.innerHTML = getSVGIcon(config.icon);
            if (config.text) {
                button.innerHTML += config.text;
                button.classList.add("text");
            }
            button.addEventListener("click", () =>
                config.onClick(params.data.id)
            );
            span.appendChild(button);
        });
        return span;
    }

    function shouldRenderButton(rowData: any, buttonType: any) {
        // Implement logic to determine if the button should be rendered
        // based on row data and button type
        return true; // For now, always render all buttons
    }

    async function refreshStudies() {
        console.log("Refreshing studies");
        if (gridApi) gridApi.setGridOption("loading", true);
        await dataStore.getStudies();
        // updateGridData() is not needed; debounced effect will handle
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
</svelte:head>

<div class="card grid-header w-full">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
            <h3 class="main-label-text mr-2">Studies</h3>
            <button type="button" class="icon-button primary inverted" onclick={() => addObject("study")}><IconPlus size="16" /></button>
            <button type="button" class="icon-button primary inverted" onclick={refreshStudies}><IconRefresh size="16" /></button>
        </div>
        
        <div class="flex items-center gap-2">
            <div class="view-controls">
                <select 
                    id="view-select" 
                    bind:value={selectedView} 
                    onchange={() => {
                        applyView(selectedView);
                        refreshStudies();
                    }}
                    class="view-select"
                >
                    {#each viewOptions as option}
                        <option value={option.id}>{option.label}</option>
                    {/each}
                </select>
            </div>
            
            {#if hasCustomGrouping}
                <button 
                    type="button" 
                    class="save-view-button" 
                    onclick={saveCustomView}
                    title="Save current custom grouping"
                >
                    Save View
                </button>
            {/if}
        </div>
    </div>
</div>
<div id="studyGrid" class="{gridTheme} ag-grid"></div>
<DeleteObjectDialog
    open={deleteDialogOpen}
    objectType="study"
    object={objectToDelete}
    on:delete={() => {
        onStudyChanged();
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
    on:cancel={() => {
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
/>

<style>
.view-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.view-label {
    font-size: 0.875rem;
    color: white;
    font-weight: 500;
}

.view-select {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    border: 1px solid var(--primary-600);
    border-radius: 0.5rem;
    background-color: transparent;
    color: var(--primary-600);
    cursor: pointer;
    min-width: 220px;
}

.view-select:hover {
    color: white;
}

.view-select:focus {
    outline: none;
    color: white;
    border-color: var(--primary-600);
}

.save-view-button {
    padding: 0.3125rem 0.5625rem;
    font-size: 0.875rem;
    background-color: transparent;
    color: var(--primary-600);
    border: 1px solid var(--primary-600);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
    white-space: nowrap;
}

.save-view-button:hover {
    background-color: var(--primary-600);
    color: white;
}

.save-view-button:active {
    background-color: var(--primary-600);
    color: white;
}
</style>
