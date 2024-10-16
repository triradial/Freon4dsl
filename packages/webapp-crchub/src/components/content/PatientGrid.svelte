<script lang="ts">
    import { getStudyPatients } from "../../services/dataStore";
    import { onMount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { navigateTo } from "../../services/routeAction";
    import { theme } from "../../services/themeStore";
    import GridHeader from "../common/GridHeader.svelte";
    import { getSVGIcon } from "../../services/utils";
    import { editObject } from "../../services/objectDrawerStore";
    import ObjectDrawerSystem from "../common/ObjectDrawerSystem.svelte";

    export let studyId: string;

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let patientsData: any[] = [];

    $: {
        patientsData = getStudyPatients(studyId);
        updateGridData();
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

    $: gridTheme = $theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";

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
                    field: "displayName",
                    headerName: "Name",
                    filter: "agSetColumnFilter",
                    filterParams: {
                        excelMode: "mac",
                    },
                },
                {
                    field: "dob",
                    headerName: "DOB",
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
                            { type: 'edit', icon: 'edit', onClick: onEditClick },
                            { type: 'delete', icon: 'delete', onClick: onDeleteClick }
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

    function onDeleteClick(data: { patientNumber: string }) {
        console.log("Delete clicked for patient:", data);
        if (confirm(`Are you sure you want to delete patient ${data.patientNumber}?`)) {
            // TODO: Implement delete functionality
        }
    }

    function onEditClick(patientNumber: string) {
        editObject("patient", patientNumber);
    }

    function createActionButtons(params: any, buttonConfigs: any) {
        const span = document.createElement("span");
        span.classList.add("grid-button-group");

        buttonConfigs.forEach((config: any) => {
            if (shouldRenderButton(params.data, config.type)) {
                const button = document.createElement("button");
                button.classList.add("grid-button", `${config.type}-button`);
                button.innerHTML = getSVGIcon(config.icon);
                button.addEventListener("click", () => config.onClick(params.data));
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

<GridHeader title="Patients" />
<div id="patientGrid" class="{gridTheme} ag-grid"></div>
