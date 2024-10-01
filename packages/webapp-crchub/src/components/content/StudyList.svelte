<script lang="ts">
    import { studies } from "../../services/datastore";
    import { onMount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { navigateTo } from "../../services/routeAction";
    import { theme } from '../../services/themeStore';
    import GridHeader from '../common/GridHeader.svelte';
    import { getSVGIcon } from "../../services/utils";

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let studiesData: any[] = [];

    $: studiesData = $studies;
    $: if (gridApi && studiesData) {
        gridApi.setGridOption("rowData", studiesData);
        resizeColumns();
    }
    $: gridTheme = $theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz';

    function resizeColumns() {
        gridApi.sizeColumnsToFit();
        gridApi.autoSizeAllColumns();
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
                if (studiesData.length > 0) {
                    resizeColumns();
                }
            },
            
        };

        const gridElement = document.querySelector("#studyGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);

        // await loadStudies();

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

    function onOpenClick(studyId: string) {
        navigateTo("study", studyId);
    }

    function onDeleteClick(data: { studyId: string }) {
        console.log("Delete clicked for patient:", data);
        if (confirm(`Are you sure you want to delete patient ${data.studyId}?`)) {
            // TODO: Implement delete functionality
        }
    }

    function onEditClick(data: { studyId: string }) {
        console.log("Edit clicked for patient:", data);
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

<GridHeader title="Studies" />
<div id="studyGrid" class={gridTheme} style="height:100%;width:100%;"></div>
