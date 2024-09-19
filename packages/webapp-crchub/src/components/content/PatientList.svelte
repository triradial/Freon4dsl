<script lang="ts">
    import { patients, loadPatients } from "../../services/datastore";
    import { onMount } from "svelte";
    import { createGrid, GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let patientsData: any[] = [];

    // Subscribe to the patients store and update when it changes
    $: patientsData = $patients;
    $: if (gridApi) {
        gridApi.setGridOption("rowData", patientsData);
    }

    onMount(async () => {
        await loadPatients();

        gridOptions = {
            rowData: patientsData,
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
            },
            columnDefs: [
                { field: "name", flex: 3 },
                { field: "dob", flex: 8 },
                { field: "study", flex: 2, enableRowGroup: true },
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

<div id="patientGrid" class="ag-theme-quartz-dark" style="height:100%;width:100%;"></div>
