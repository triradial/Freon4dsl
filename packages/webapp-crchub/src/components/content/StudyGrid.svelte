<script lang="ts">
    import { dataStore } from "$services/data/data-store.js";
    import { editObject } from "$services/stores/object-drawer-store.js";
    import { onMount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { navigateTo } from "$services/routing/route-action.js";
    import { theme } from "$services/stores/theme-store.js";
    import GridHeader from "../common/GridHeader.svelte";
    import { getSVGIcon } from "$services/utils.js";
    import DeleteObjectDialog from "../dialogs/DeleteObjectDialog.svelte";

    let deleteDialogOpen = $state(false);
    let objectToDelete = $state<any>(null);

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let studiesData = $derived($dataStore.studies);
    let canManageStudies = true;
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");
    let isGridReady = $state(false);
    let hasFullReset = $state(false);
    let isResetting = $state(false);

    $effect(() => {
        console.log("[StudyGrid] $effect studiesData:", studiesData);
        updateGridData();
    });
    
    $effect(() => {
        if (objectToDelete) {
            console.log("Object to delete:", objectToDelete);
        }
    });

    $effect(() => {
        if (isGridReady && gridApi) {
            // Ensure headers and columns are sized correctly once the grid is fully visible
            gridApi.sizeColumnsToFit();
            gridApi.autoSizeAllColumns();
            gridApi.refreshHeader();
            // Force a redraw to ensure header and body are fully in sync
            gridApi.redrawRows();
            gridApi.refreshCells({ force: true });
            // Perform full client-side model refresh → forces complete grid rerender
            gridApi.refreshClientSideRowModel('map');
        }
    });

    function updateGridData() {
        if (gridApi && studiesData) {
            gridApi.setGridOption("rowData", studiesData);
            setTimeout(() => {
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
            }, 100);
        }
    }

    function initializeGrid() {
        const gridElement = document.querySelector("#studyGrid") as HTMLElement;
        if (gridApi) {
            gridApi.destroy();
        }
        gridApi = createGrid(gridElement, gridOptions);
        if (studiesData) {
            gridApi.setGridOption("rowData", studiesData);
        }
    }

    $effect(() => {
        // After grid is first ready and initial sizing finished, fully recreate grid once
        if (isGridReady && !hasFullReset) {
            isResetting = true;
            // small delay to allow overlay to appear
            setTimeout(() => {
                initializeGrid();
                hasFullReset = true;
                isResetting = false;
            }, 100);
        }
    });

    onMount(async () => {
        gridOptions = {
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
            },
            autoSizeStrategy: {
                type: "fitCellContents",
            },
            columnDefs: [
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
            ],
            groupDisplayType: "groupRows",
            rowGroupPanelShow: "always",
            onGridReady: (params) => {
                if (studiesData.length > 0) {
                    updateGridData();
                }
                // Set grid as ready after a short delay to ensure everything is rendered properly
                setTimeout(() => {
                    isGridReady = true;
                    // extra safety: trigger resize immediately after marking ready
                    params.api.refreshHeader();
                }, 100);
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

    function onOpenClick(studyId: string) {
        console.log("Open clicked for studyid:", studyId);
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
        console.log("Edit clicked for study:", studyId);
        editObject("study", studyId);
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
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
</svelte:head>

<GridHeader title="Studies" objectType="study" />
<div class="grid-wrapper">
    <div id="studyGrid" class="{gridTheme} ag-grid" style="visibility:{isResetting ? 'hidden' : 'visible'}"></div>
    {#if !isGridReady || isResetting}
        <div class="loading-overlay">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading studies grid...</div>
        </div>
    {/if}
</div>
<DeleteObjectDialog
    bind:open={deleteDialogOpen}
    objectType="study"
    object={objectToDelete}
    on:delete={() => {
        updateGridData();
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
    on:cancel={() => {
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
/>

<style>
.grid-wrapper {
    position: relative;
    height: 100%;
}
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.75);
    z-index: 10;
}
</style>
