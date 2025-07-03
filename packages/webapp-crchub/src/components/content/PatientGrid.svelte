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

    const { studyId } = $props<{ studyId: string }>();

    let deleteDialogOpen = $state(false);
    let objectToDelete = $state<any>(null);

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let patientsData = $derived($dataStore.studyPatients);
    let canManageStudies = true;
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");

    $effect(() => {
        // console.log("[PatientGrid] $effect patientsData:", patientsData);
        updateGridData();
    });

    // $effect(() => {
    //     if (objectToDelete) {
    //         console.log("[PatientGrid] $effect objectToDelete:", objectToDelete);
    //     }
    // });

    function updateGridData() {
        if (gridApi && patientsData) {
            gridApi.setGridOption("rowData", patientsData);
            setTimeout(() => {
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
            }, 100);
        }
    }

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
                        return createNameCell(params);
                    },
                    // cellRenderer: (params: any) => {
                    //     const patientId = params.data.id;
                    //     const patientNumber = params.data.patientNumber;
                    //     return `<a href="#" data-patient-id="${patientId}">${patientNumber}</a>`;
                    // },
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
                }
            ],
            groupDisplayType: "groupRows",
            rowGroupPanelShow: "always",
            onGridReady: (params) => {
                if (patientsData.length > 0) {
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

    function createNameCell(params: any) {
        const name = `<a href="#" data-patient-id="${params.data.id}">${params.data.patientNumber}</a>`;
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
