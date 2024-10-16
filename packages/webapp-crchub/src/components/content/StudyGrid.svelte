<script lang="ts">
    import { studies } from "../../services/dataStore";
    import { editObject } from "../../services/objectDrawerStore";
    import { onMount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { navigateTo } from "../../services/routeAction";
    import { theme } from '../../services/themeStore';
    import GridHeader from '../common/GridHeader.svelte';
    import { getSVGIcon } from "../../services/utils";
    import { getContext } from 'svelte';

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let studiesData: any[] = [];

    $: {
        studiesData = $studies;
        updateGridData();
    }

    function updateGridData() {
        if (gridApi && studiesData) {
            gridApi.setGridOption("rowData", studiesData);
            setTimeout(() => {
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
            }, 100);
        }
    }

    // $: if (gridApi && studiesData) {
    //     gridApi.setGridOption("rowData", studiesData);
    //     resizeColumns();
    // }
    $: gridTheme = $theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz';

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
                    // gridApi.setGridOption("rowData", studiesData);
                    // resizeColumns();
                    updateGridData();
                }
            },
        };

        const gridElement = document.querySelector("#studyGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);

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

    function onDeleteClick(studyId: string) {
        console.log("Delete clicked for patient:", studyId);
        if (confirm(`Are you sure you want to delete patient ${studyId}?`)) {
            // TODO: Implement delete functionality
        }
    }

    function onEditClick(studyId: string) {
        console.log("Edit clicked for patient:", studyId);
        editObject("study", studyId);
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

<GridHeader title="Studies" />
<div id="studyGrid" class="{gridTheme} ag-grid"></div>
