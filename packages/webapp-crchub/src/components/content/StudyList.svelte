<script lang="ts">
    import { studies, loadStudies } from "../../services/datastore";
    import { onMount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let studiesData: any[] = [];

    // Subscribe to the patients store and update when it changes
    $: studiesData = $studies;
    $: if (gridApi) {
        gridApi.setGridOption("rowData", studiesData);
    }

    onMount(async () => {
        await loadStudies();

        gridOptions = {
            rowData: studiesData,
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
            },
            columnDefs: [
                { field: "name", flex: 3 },
                { field: "title", flex: 8 },
                { field: "phase", flex: 2, enableRowGroup: true },
                { field: "status", flex: 2, enableRowGroup: true },
                { field: "therapeutic-area", flex: 3, enableRowGroup: true },
            ],
            groupDisplayType: "groupRows",
            rowGroupPanelShow: "always",
        };

        const gridElement = document.querySelector("#studyGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);

    });

</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
</svelte:head>

<div id="studyGrid" class="ag-theme-quartz-dark" style="height:100%;width:100%;"></div>
