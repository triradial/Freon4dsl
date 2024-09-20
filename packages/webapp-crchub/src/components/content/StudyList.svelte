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
            autoSizeStrategy: {
                type: 'fitCellContents'
            },
            columnDefs: [
                { 
                    field: "name", 
                    tooltipField: "title",
                    cellRenderer: (params: any) => {
                        const studyId = params.data.id;
                        const studyName = params.data.name;
                        return `<a href="#" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('loadContent', { 'Study' }))">${studyId}${studyName}</a>`;
                    },
                    // cellRenderer: (params: { data: { id: string, name: string } }) => {
                    //     return `<a href="#" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('loadContent', { detail: { contentName: 'Study', studyId: '${params.data.id}' } }))">${params.data.name}</a>`;
                    // }
                },
                { 
                    field: "phase", 
                    enableRowGroup: true, 
                    resizable: false 
                },
                { 
                    field: "status", 
                    enableRowGroup: true,
                    filter: 'agSetColumnFilter',
                    filterParams: {
                        excelMode: 'mac',
                    }
                },
                { 
                    field: "therapeutic-area", 
                    enableRowGroup: true,
                    filter: 'agSetColumnFilter',
                    filterParams: {
                        excelMode: 'mac',
                    } 
                },
            ],
            groupDisplayType: "groupRows",
            rowGroupPanelShow: "always",
        };

        const gridElement = document.querySelector("#studyGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);

        function StudyRenderer(params: any) {
            const link = `<a href="#" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('loadContent', { detail: { contentName: 'Study', studyId: '${params.data.id}' } }))">${params.value}</a>`;
            return link;
        }

    });

</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
</svelte:head>

<div id="studyGrid" class="ag-theme-quartz" style="height:100%;width:100%;"></div>
