<script lang="ts">
    import { dataStore } from "../../services/data/data-store.js";
    import { editObject } from "../../services/stores/object-drawer-store.js";
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

    let deleteDialogOpen = $state(false);
    let objectToDelete = $state<any>(null);

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let studiesData = $derived($dataStore.studies);
    let user = null;
    let showGrid = $derived(!!user);
    let canManageStudies = true;
    let isResetting = $state(false);
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");
    let hasFetched = $state(false);

    let updateTimeout: any = null;
    let userUnsubscribe;
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

    onMount(() => {
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
                } else {
                    gridApi.setGridOption("loading", false);
                }
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

<GridHeader title="Studies" objectType="study" onrefresh={refreshStudies} />
<div id="studyGrid" class="{gridTheme} ag-grid" style="visibility:{isResetting ? 'hidden' : 'visible'}"></div>
<DeleteObjectDialog
    open={deleteDialogOpen}
    objectType="study"
    object={objectToDelete}
    ondelete={() => {
        onStudyChanged();
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
    oncancel={() => {
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
/>
