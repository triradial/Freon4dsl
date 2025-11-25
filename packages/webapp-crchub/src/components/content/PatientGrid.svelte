<script lang="ts">
    import type { GridApi, GridOptions } from "ag-grid-community";
    import { createGrid } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { onMount } from "svelte";
    import { dataStore } from "../../services/data/data-store.js";
    import { navigateTo } from "../../services/routing/route-action.js";
    import { editObject } from "../../services/stores/object-drawer-store.js";
    import { theme } from "../../services/stores/theme-store.js";
    import { getSVGIcon } from "../../services/utils.js";
    import DeleteObjectDialog from "../dialogs/DeleteObjectDialog.svelte";
// @ts-ignore
    import { Plus as IconPlus, RefreshCcw as IconRefresh } from '@lucide/svelte';

    const { studyId } = $props<{ studyId: string }>();

    let deleteDialogOpen = $state(false);
    let objectToDelete = $state<any>(null);
    let loading = $state(false);

    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let patientsData = $derived($dataStore.studyPatients);
    let canManageStudies = true;
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");

    async function fetchPatients() {
        loading = true;
        await dataStore.getStudyPatients(studyId);
        loading = false;
    }

    $effect(() => {
        updateGridData();
    });

    function updateGridData() {
        if (gridApi && patientsData) {
            gridApi.setGridOption("rowData", patientsData);
            setTimeout(() => {
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
                // Hide AG-Grid loading overlay and show/hide no-rows overlay as appropriate
                if (patientsData.length === 0) {
                    gridApi.setGridOption("loading", false);
                }
            }, 100);
        }
    }

    onMount(async () => {
        await fetchPatients();
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
                } else {
                    gridApi.setGridOption("loading", false);
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
        fetchPatients();
    }

    function onPatientChanged() {
        fetchPatients();
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

    async function refreshPatients() {
        console.log("Refreshing patients"); 
        loading = true;
        await dataStore.getStudyPatients(studyId);
        updateGridData();
        loading = false;
    }

</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
</svelte:head>

<div class="card grid-header w-full">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
            <h3 class="main-label-text mr-2">Patients</h3>
            <button type="button" class="icon-button primary inverted" onclick={() => import("../../services/stores/object-drawer-store.js").then(m => m.addObject("patient", studyId))}><IconPlus size="16" /></button>
            <button type="button" class="icon-button primary inverted" onclick={refreshPatients}><IconRefresh size="16" /></button>
        </div>
    </div>
</div>
<div id="patientGrid" class="{gridTheme} ag-grid"></div>
<DeleteObjectDialog
    open={deleteDialogOpen}
    objectType="patient"
    object={objectToDelete}
    ondelete={() => {
        onPatientChanged();
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
    oncancel={() => {
        deleteDialogOpen = false;
        objectToDelete = null;
    }}
/>
