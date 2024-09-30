<script lang="ts">
    import { getStudyPatients } from "../../services/datastore";
    import { onMount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { navigateTo } from "../../services/routeAction";
    import { theme } from '../../services/themeStore';

    export let studyId: string;

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let patientsData: any[] = [];

    $: patientsData = getStudyPatients(studyId);
    $: if (gridApi) {
        gridApi.setGridOption("rowData", patientsData);
    }
    $: gridTheme = $theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz';

    onMount(async () => {
        gridOptions = {
            rowData: patientsData,
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
            },
            autoSizeStrategy: {
                type: 'fitCellContents'
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
                }
            ],
            groupDisplayType: "groupRows",
            rowGroupPanelShow: "always",
        };

        const gridElement = document.querySelector("#patientGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);
        
        gridElement.addEventListener("click", (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === "A") {
                event.preventDefault();
                const patientId = target.getAttribute("data-patient-id");
                if (patientId) {
                    handlePatientClick(patientId);
                }
            }
        });
    });
    function handlePatientClick(patientId: string) {
        navigateTo("patient", patientId);
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
</svelte:head>

<div id="patientGrid" class={gridTheme} style="height:100%;width:100%;"></div>
