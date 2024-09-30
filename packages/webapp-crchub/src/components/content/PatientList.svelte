<script lang="ts">
    import { patients, loadPatients } from "../../services/datastore";
    import { onMount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { navigateTo } from "../../services/routeAction";
    import { theme } from '../../services/themeStore';

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let patientsData: any[] = [];

    $: patientsData = $patients;
    $: if (gridApi) {
        gridApi.setGridOption("rowData", patientsData);
    }
    $: gridTheme = $theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz';

    onMount(async () => {
        await loadPatients();

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
                    field: "name"             
                },
                { 
                    field: "dob",          
                }
            ],
            groupDisplayType: "groupRows",
            rowGroupPanelShow: "always",
        };

        const gridElement = document.querySelector("#patientGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);

    });
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
</svelte:head>

<div id="patientGrid" class={gridTheme} style="height:100%;width:100%;"></div>
