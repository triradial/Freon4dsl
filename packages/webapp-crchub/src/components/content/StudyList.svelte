<script lang="ts">
    import { studies, loadStudies } from "../../services/datastore";
    import { onMount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { navigateTo } from "../../services/routeAction";
    import { theme } from '../../services/themeStore';

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let studiesData: any[] = [];

    $: studiesData = $studies;
    $: if (gridApi) {
        gridApi.setGridOption("rowData", studiesData);
    }
    $: gridTheme = $theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz';

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
                type: "fitCellContents",
            },
            columnDefs: [
                {
                    field: "name",
                    tooltipField: "title",
                    cellRenderer: (params: any) => {
                        const studyId = params.data.id;
                        const studyName = params.data.name;
                        return `<a href="#" data-study-id="${studyId}">${studyName}</a>`;
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
                },
            ],
            groupDisplayType: "groupRows",
            rowGroupPanelShow: "always",
        };

        const gridElement = document.querySelector("#studyGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);

        gridElement.addEventListener("click", (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === "A") {
                event.preventDefault();
                const studyId = target.getAttribute("data-study-id");
                if (studyId) {
                    handleStudyClick(studyId);
                }
            }
        });
    });

    function handleStudyClick(studyId: string) {
        navigateTo("study", studyId);
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
</svelte:head>

<div id="studyGrid" class={gridTheme} style="height:100%;width:100%;"></div>
