<script lang="ts">
    import { dataStore } from "../../services/data/data-store.js";
    import { onMount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { navigateTo } from "../../services/routing/route-action.js";
    import { theme } from "../../services/stores/theme-store.js";
    import GridHeader from "../common/GridHeader.svelte";
    import { getSVGIcon } from "../../services/utils.js";
    import { editObject } from "../../services/stores/object-drawer-store.js";
    import DeleteObjectDialog from "../dialogs/DeleteObjectDialog.svelte";

    export let studyId: string;

    let deleteDialogOpen = false;
    let objectToDelete: any = null;

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let patientsData: any[] = [];

    $effect(() => {
        if (studyId) {
            fetchStudyPatients();
        }
    });

    $effect(() => {
        patientsData = $dataStore.studyPatients;
        updateGridData();
    });

    // $: if ($studyPatients) {
    //     patientsData = $studyPatients;
    //     updateGridData();
    // }

    async function fetchStudyPatients() {
        await dataStore.getStudyPatients(studyId);
    }

    function updateGridData() {
        if (gridApi && patientsData) {
            gridApi.setGridOption("rowData", patientsData);
            setTimeout(() => {
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
            }, 100);
        }
    }

    let gridTheme = $derived(() => $theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");

    $effect(() => {
        if (objectToDelete) {
            console.log("Object to delete:", objectToDelete);
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
                    field: "patientNumber",
                    headerName: "Number",
                    cellRenderer: (params: any) => {
                        const patientId = params.data.id;
                        const patientNumber = params.data.patientNumber;
                        return `<a href="#" data-patient-id="${patientId}">${patientNumber}</a>`;
                    },
                    filter: "agSetColumnFilter",
                    filterParams: {
                        excelMode: "mac",
                    },
                },
                {
                    field: "initials",
                    headerName: "Initials",
                    filter: "agSetColumnFilter",
                    filterParams: {
                        excelMode: "mac",
                    },
                },
                {
                    field: "dob",
                    headerName: "YOB",
                    filter: "agSetColumnFilter",
                    filterParams: {
                        excelMode: "mac",
                    },
                },
                {
                    field: "gender",
                    enableRowGroup: true,
                    filter: "agSetColumnFilter",
                    filterParams: {
                        excelMode: "mac",
                    },
                },
                {
                    headerName: "Actions",
                    field: "actions",
                    cellRenderer: (params: any) => {
                        return createActionButtons(params, [
                            { type: "edit", icon: "edit", onClick: onEditClick },
                            { type: "delete", icon: "delete", onClick: onDeleteClick },
                        ]);
                    },
                    width: 100,
                    sortable: false,
                    filter: false,
                },
            ],
            groupDisplayType: "groupRows",
            rowGroupPanelShow: "always",
            onGridReady: (params) => {
                if (patientsData.length > 0) {
                    // gridApi.setGridOption("rowData", studiesData);
                    // resizeColumns();
                    updateGridData();
                }
            },
        };

        const gridElement = document.querySelector("#patientGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);

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

    function onOpenClick(patientId: string) {
        navigateTo("patient", patientId);
    }

    function onDeleteClick(patientId: string) {
        console.log("Delete clicked for patient:", patientId);
        objectToDelete = patientsData.find((p) => p.id === patientId);
        if (objectToDelete) {
            deleteDialogOpen = true;
        }
    }

    function onEditClick(patientId: string) {
        editObject("patient", patientId);
    }

    function createActionButtons(params: any, buttonConfigs: any) {
        const span = document.createElement("span");
        span.classList.add("grid-button-group");

        buttonConfigs.forEach((config: any) => {
            if (shouldRenderButton(params.data, config.type)) {
                const button = document.createElement("button");
                button.classList.add("grid-button", `${config.type}-button`);
                button.innerHTML = getSVGIcon(config.icon);
                button.addEventListener("click", () => config.onClick(params.data.id));
                span.appendChild(button);
            }
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

<GridHeader title="Patients" objectType="patient" parentId={studyId} />
<div id="patientGrid" class="{gridTheme} ag-grid"></div>
<DeleteObjectDialog
    bind:open={deleteDialogOpen}
    objectType="patient"
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
