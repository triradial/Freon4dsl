<script lang="ts">
    import { dataStore, type Study } from "../../../services/data/data-store.js";
    import { getStudyTemplates } from "../../../services/data/study-templates.js";
    import { editObject, addObject, openObjectDrawer } from "../../../services/stores/object-drawer-store.js";
    import { Popover } from "@skeletonlabs/skeleton-svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { mount, unmount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { navigateTo } from "../../../services/routing/route-action.js";
    import { theme } from "../../../services/stores/theme-store.js";
    import GridHeader from "../../common/GridHeader.svelte";
    import { ensureUniqueCopyLabel, getSVGIcon } from "../../../services/utils.js";
    import SaveViewDialog from "../../dialogs/SaveViewDialog.svelte";
    import { userStore } from "../../../services/stores/users-store.js";
    import { adminModeStore } from "../../../services/stores/admin-mode-store.js";
    import { untrack } from "svelte";
    // @ts-ignore
    import { Plus as IconPlus, RefreshCcw as IconRefresh, ChevronDown as IconChevronDown } from '@lucide/svelte';
    import type { SelectOption } from '@freon4dsl/core';
    import ConfirmUnsavedDialog from '../../dialogs/ConfirmUnsavedDialog.svelte';
    import StudyNameCell from "./StudyNameCell.svelte";


    let gridOptions: GridOptions;
    let gridApi: GridApi;
    let studiesData = $derived($dataStore.studies);
    let user = null;
    let showGrid = $derived(!!user);
    let canManageStudies = true;
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");
    let hasFetched = $state(false);

    let updateTimeout: any = null;
    let userUnsubscribe;
    let adminMode = $derived($adminModeStore);
    
    // LocalStorage key for saving column state
    const STUDIES_COLUMN_STATE_KEY = "crchub-studies-column-state";
    const STUDIES_VIEW_KEY = "crchub-studies-view";
    const ACTIVE_VIEW_KEY = "crchub-studies-active-view";
    
    // Reactive variable to track if there's saved state
    let hasSavedState = $state(false);
    let hasCustomGrouping = $state(false);
    let selectedView = $state("default");

    // Stores the column configuration that represents the default view
    let defaultColumnState: any[] = [];
    // Keeps the column state of the currently applied non-custom view so we can detect real changes
    let referenceViewState: any[] = [];

    // Flag to suppress saveColumnState reactions while programmatically applying a view
    let isApplyingView = false;
    
    // Predefined views
    const predefinedViews: SelectOption[] = [
        { id: "default", label: "Default" }
    ];

    const SAVED_VIEWS_KEY = "crchub-studies-saved-views";

    // Helper to load previously saved named views
    function loadSavedViews(): any[] {
        const raw = localStorage.getItem(SAVED_VIEWS_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    // Saved views loaded at start
    let savedViews: any[] = loadSavedViews();

    // Mutable list so we can push saved views
    let viewOptions = $state<SelectOption[]>([
        ...predefinedViews,
        ...savedViews.map(v => ({ id: v.id, label: v.label }))
    ]);

    // The currently selected option object for the dropdown
    let selectedViewOption = $state<SelectOption>(predefinedViews[0]);
    let showMenu = $state(false);
    let menuAnchor: HTMLElement | null = null;
    let hasUnsavedChanges = $state(false);
    let menuRef = $state<HTMLDivElement | null>(null);

    // Retrieve previously active view from sessionStorage (applied after grid ready)
    let initialActiveView: string | null = sessionStorage.getItem(ACTIVE_VIEW_KEY);

    // Dialog state
    let saveDialogOpen = $state(false);
    
    let confirmUnsavedOpen = $state(false);
    let pendingViewChange: string | null = null;
    
    // Quick filter state
    let filterValue = $state("");
    
    // Delete confirmation popover state
    let deleteConfirmInstance: any = null;
    let deleteConfirmContainer: HTMLDivElement | null = null;
    let deleteConfirmTriggerElement: HTMLElement | null = null;
    let deleteConfirmStudyData: Study | null = null;

    // Add Study dropdown (New Study vs Create from Template)
    let addMenuOpen = $state(false);
    const studyTemplates = getStudyTemplates();

    $effect(() => {
        // keep the gridApi and studiesData in scope
        void gridApi;
        void studiesData;
        if (gridApi && studiesData) {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                gridApi.setGridOption("rowData", studiesData);
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
                // Hide loading overlay after data is set
                gridApi.setGridOption("loading", false);
            }, 100);
        }
    });

    async function fetchStudies() {
        if (gridApi) gridApi.setGridOption("loading", true);
        await dataStore.getStudies(adminMode);
        // Do not set loading to false here; let the debounced effect handle it after data is set
    }

    $effect(() => {
        if (user && studiesData.length === 0 && !hasFetched) {
            hasFetched = true;
            fetchStudies();
        }
    });

    // Watch for admin mode changes and refetch data
    let previousAdminMode = $state<boolean | null>(null);
    
    $effect(() => {
        // Only track adminMode changes
        const currentAdminMode = adminMode;
        
        // Skip the first initialization
        if (previousAdminMode !== null && previousAdminMode !== currentAdminMode) {
            console.log('[StudyGrid] Admin mode changed from', previousAdminMode, 'to', currentAdminMode);
            
            untrack(() => {
                // Use untrack to prevent infinite loops
                if (user && gridApi) {
                    console.log('[StudyGrid] Refetching studies with adminMode:', currentAdminMode);
                    fetchStudies();
                    
                    // Update column definitions to show/hide Organization column
                    console.log('[StudyGrid] Updating column definitions');
                    gridApi.setGridOption("columnDefs", getColumnDefs());
                }
            });
        }
        
        previousAdminMode = currentAdminMode;
    });

    function updateGridData() {
        if (gridApi && studiesData) {
            gridApi.setGridOption("rowData", studiesData);
            setTimeout(() => {
                gridApi.sizeColumnsToFit();
                gridApi.autoSizeAllColumns();
                if (studiesData.length === 0) {
                    gridApi.setGridOption("loading", false);
                }
            }, 100);
        }
    }

    // Save column state to localStorage
    function saveColumnState() {
        // Ignore events during predefined view application
        if (isApplyingView) return;

        const columnState = gridApi.getColumnState();

        // If current view is not "custom", compare with referenceViewState
        if (selectedView !== "default" && referenceViewState.length > 0) {
            if (stateEquals(columnState, referenceViewState)) {
                // Still same as the selected view, nothing to do
                hasUnsavedChanges = false;
                return;
            }
        }

        // Determine if current state equals default (for safety)
        const isDefault = columnState.every(col => !col.rowGroup && !col.hide && !col.pinned && !col.sort);
        if (isDefault && selectedView === "default") {
            hasUnsavedChanges = false;
            referenceViewState = defaultColumnState;
            return;
        }

        hasUnsavedChanges = true;
    }

    // Check if current grouping matches any predefined view
    function isPredefinedView(columnState) {
        // Only 'default' is considered predefined now (no grouping)
        const hasGrouping = columnState.some(col => col.rowGroup);
        return !hasGrouping;
    }

    // Get grouping configuration for a view
    function getGroupingForView(viewValue) {
        switch (viewValue) {
            case "phase":
                return ["phase"];
            case "status":
                return ["status"];
            case "therapeuticArea":
                return ["therapeuticArea"];
            default:
                return [];
        }
    }

    // Apply a predefined view
    function applyView(viewValue) {
        if (!gridApi) return;

        // Handle 'custom' specially: keep current grid state intact
        const savedStateRaw = localStorage.getItem(`${STUDIES_COLUMN_STATE_KEY}-${viewValue}`);
        if (savedStateRaw) {
            const savedState = JSON.parse(savedStateRaw);
            isApplyingView = true;
            gridApi.applyColumnState({ state: savedState, applyOrder: true });
            selectedView = viewValue;
            referenceViewState = savedState;
            hasUnsavedChanges = false;
            sessionStorage.setItem(ACTIVE_VIEW_KEY, viewValue);
            setTimeout(() => { isApplyingView = false; }, 100);
            return;
        }

        // Default view
        isApplyingView = true;
        const resetState = gridApi.getColumnState().map(col => ({
            colId: col.colId,
            rowGroup: false,
            rowGroupIndex: null,
            sort: null,
            sortIndex: null,
            hide: false,
            pinned: null
        }));
        gridApi.applyColumnState({ state: resetState, applyOrder: true });
        defaultColumnState = resetState;
        referenceViewState = resetState;
        selectedView = viewValue;
        localStorage.setItem(STUDIES_VIEW_KEY, viewValue);
        sessionStorage.setItem(ACTIVE_VIEW_KEY, viewValue);
        hasUnsavedChanges = false;
        setTimeout(() => {
            isApplyingView = false;
        }, 100);
    }

    // Save current grouping as custom view
    function saveCustomView() {
        saveDialogOpen = true;
    }

    // Handle save dialog confirmation
    async function handleSaveView(event) {
        const viewName: string = event.detail;
        if (!gridApi || !viewName) return;

        const columnState = gridApi.getColumnState();

        // Retrieve existing saved views
        savedViews = loadSavedViews();

        const id = viewName.toLowerCase().replace(/\s+/g, "-");
        const newViewMeta = { id, label: viewName, state: columnState };
        savedViews.push(newViewMeta);
        localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));

        // Persist column state under KEY specific to this view as well
        localStorage.setItem(`${STUDIES_COLUMN_STATE_KEY}-${id}`, JSON.stringify(columnState));

        // update dropdown options
        // Place new view before 'custom'
        viewOptions = [...predefinedViews, ...savedViews.map(v => ({ id: v.id, label: v.label }))];

        // Wait for DOM to update with new option before selecting
        await tick();

        selectedView = id;
        selectedViewOption = viewOptions.find(v => v.id === id) as any;

        // Programmatically apply the saved view (so grid events match reference state)
        applyView(id);

        // Reload page so dropdown is fresh and grid re-inits with new view
        location.reload();

        referenceViewState = columnState;
        hasUnsavedChanges = false;
        saveDialogOpen = false;
    }

    function handleCancelSaveView() {
        saveDialogOpen = false;
    }

    // Clear saved column state
    function clearSavedColumnState() {
        localStorage.removeItem(STUDIES_COLUMN_STATE_KEY);
        hasSavedState = false;
        console.log("[StudyGrid] Saved column state cleared");
    }

    // Add menu logic
    function openMenu(event) {
        if (showMenu) {
            closeMenu();
        } else {
            menuAnchor = event.currentTarget;
            showMenu = true;
        }
    }
    function closeMenu() {
        showMenu = false;
    }
    async function handleSave() {
        if (!gridApi || selectedView === "default") return;
        const columnState = gridApi.getColumnState();
        localStorage.setItem(`${STUDIES_COLUMN_STATE_KEY}-${selectedView}`, JSON.stringify(columnState));
        // Update savedViews
        savedViews = loadSavedViews();
        const idx = savedViews.findIndex(v => v.id === selectedView);
        if (idx !== -1) {
            savedViews[idx].state = columnState;
            localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));
        }
        referenceViewState = columnState;
        hasUnsavedChanges = false;
        closeMenu();
    }
    async function handleSaveAs() {
        saveDialogOpen = true;
        closeMenu();
    }
    async function handleDelete() {
        if (selectedView === "default") return;
        // Remove from savedViews
        savedViews = loadSavedViews().filter(v => v.id !== selectedView);
        localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));
        localStorage.removeItem(`${STUDIES_COLUMN_STATE_KEY}-${selectedView}`);
        // Update viewOptions
        viewOptions = [...predefinedViews, ...savedViews.map(v => ({ id: v.id, label: v.label }))];
        selectedView = "default";
        applyView("default");
        closeMenu();
    }


    // Get initial column definitions with saved state applied
    function getColumnDefs() {
        const baseColumnDefs = [
            {
                field: "id",
                headerName: "Study ID",
                minWidth: 300,
                maxWidth: 400,
                filter: false,
                hide: true,
                cellRenderer: (params: any) => {
                    return params.value || '';
                },
            },
            {
                field: "name",
                headerName: "Study",
                minWidth: 200,
                filter: false, // Remove column filter
                cellRenderer: (params: any) => {
                    return createNameCell(params);
                },
            },
            {
                field: "patientCount",
                headerName: "Patients",
                cellRenderer: (params: any) => {
                    const count = params.value;
                    return count && count > 0 ? count : '';
                },
                sortable: true,
                filter: "agNumberColumnFilter",
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
                field: "siteNumber",
                headerName: "Site #",
                enableRowGroup: true,
                filter: "agSetColumnFilter",
                filterParams: {
                    excelMode: "mac",
                },
                width: 100,
            },
            {
                field: "organizationName",
                headerName: "Organization",
                hide: !adminMode,
                enableRowGroup: true,
                filter: "agSetColumnFilter",
                filterParams: {
                    excelMode: "mac",
                },
            }
        ];

        // Check if we have a saved view preference
        const savedView = localStorage.getItem(STUDIES_VIEW_KEY);
        if (savedView && savedView !== "default") {
            // Apply predefined view
            const groupingFields = getGroupingForView(savedView);
            groupingFields.forEach((field, index) => {
                const baseCol = baseColumnDefs.find(col => col.field === field);
                if (baseCol) {
                    (baseCol as any).rowGroup = true;
                    (baseCol as any).rowGroupIndex = index;
                }
            });
            selectedView = savedView;
            referenceViewState = gridApi.getColumnState(); // Initialize referenceViewState for saved views
        } else {
            // Apply saved custom state if no predefined view
            try {
                const savedState = localStorage.getItem(STUDIES_COLUMN_STATE_KEY);
                if (savedState) {
                    const columnState = JSON.parse(savedState);
                    console.log("[StudyGrid] Applying saved state to column definitions:", columnState);
                    
                    // Apply saved properties to matching columns
                    columnState.forEach((savedCol: any) => {
                        const baseCol = baseColumnDefs.find(col => col.field === savedCol.colId);
                        if (baseCol) {
                            // Apply row grouping
                            if (savedCol.rowGroup) {
                                (baseCol as any).rowGroup = true;
                                if (typeof savedCol.rowGroupIndex === 'number') {
                                    (baseCol as any).rowGroupIndex = savedCol.rowGroupIndex;
                                }
                            }
                            // Apply column visibility
                            if (savedCol.hide) {
                                (baseCol as any).hide = true;
                            }
                            // Apply column width
                            if (savedCol.width) {
                                (baseCol as any).width = savedCol.width;
                            }
                            // Apply column pinning
                            if (savedCol.pinned) {
                                (baseCol as any).pinned = savedCol.pinned;
                            }
                            // Apply sorting
                            if (savedCol.sort) {
                                (baseCol as any).sort = savedCol.sort;
                                if (typeof savedCol.sortIndex === 'number') {
                                    (baseCol as any).sortIndex = savedCol.sortIndex;
                                }
                            }
                        }
                    });
                    
                    hasSavedState = true;
                    referenceViewState = columnState; // Initialize referenceViewState for saved custom state
                }
            } catch (error) {
                console.warn("[StudyGrid] Failed to apply saved state to column definitions:", error);
            }
        }

        return baseColumnDefs;
    }



    onMount(() => {
        // Initialize saved state indicator
        hasSavedState = localStorage.getItem(STUDIES_COLUMN_STATE_KEY) !== null;
        
        // Initialize selected view
        const savedView = localStorage.getItem(STUDIES_VIEW_KEY);
        // Override selectedView with previously active one if present in session and exists in options
        if (initialActiveView && viewOptions.find(v => v.id === initialActiveView)) {
            selectedView = initialActiveView;
        } else if (savedView && viewOptions.find(v => v.id === savedView)) {
            selectedView = savedView;
            // Find the option that matches the selectedView, including saved views
            const foundOption = viewOptions.find(v => v.id === savedView) || viewOptions[0];
            selectedViewOption = foundOption;
        }
        
        userUnsubscribe = userStore.subscribe((val) => {
            user = val;
            console.debug('[StudyGrid] userStore subscription: user set to', user);
        });
        gridOptions = {
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
            },
            autoSizeStrategy: {
                type: "fitCellContents",
            },
            columnDefs: getColumnDefs(),
            groupDisplayType: "groupRows",
            rowGroupPanelShow: "always",
            sideBar: {
                toolPanels: [
                    {
                        id: 'columns',
                        labelDefault: 'Columns',
                        labelKey: 'columns',
                        iconKey: 'columns',
                        toolPanel: 'agColumnsToolPanel',
                        toolPanelParams: {
                            suppressPivotMode: true,
                            suppressRowGroups: true,
                            suppressValues: true,
                            suppressPivots: true
                        }
                    }
                ],
                defaultToolPanel: 'columns',
                hiddenByDefault: true
            },
            pagination: true,
            paginationPageSize: 20,
            paginationPageSizeSelector: [10, 20, 50, 100],
            onGridReady: (params) => {
                if (studiesData.length > 0) {
                    updateGridData();
                } else if (user) {
                    // Only trigger initial data load if user is authenticated
                    refreshStudies();
                }

                // Apply the stored active view if it isn't default and grid is ready
                if (initialActiveView && initialActiveView !== "default" && initialActiveView !== "custom") {
                    applyView(initialActiveView);
                }
            },
            // Save column state when columns change
            onColumnRowGroupChanged: () => {
                saveColumnState();
            },
            onColumnPivotChanged: () => {
                saveColumnState();
            },
            onColumnVisible: () => {
                saveColumnState();
            },
            onColumnPinned: () => {
                saveColumnState();
            },
            onColumnResized: () => {
                saveColumnState();
            },
            onColumnMoved: () => {
                saveColumnState();
            },
            onSortChanged: () => {
                saveColumnState();
            },
        };

        const gridElement = document.querySelector("#studyGrid") as HTMLElement;
        gridApi = createGrid(gridElement, gridOptions);

        // Capture the default column state after grid is initialized
        defaultColumnState = gridApi.getColumnState();
        referenceViewState = defaultColumnState; // Initialize referenceViewState for default view

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
        // Don't call refreshStudies here - let the reactive effect handle it when user is ready
    });

    onDestroy(() => {
        if (userUnsubscribe) userUnsubscribe();
        // Cleanup all mounted cell renderer components
        cellRendererInstances.forEach((value, element) => {
            try {
                if (value.component) {
                    unmount(value.component);
                } else {
                    // Handle old format where value is the component directly
                    unmount(value);
                }
            } catch (e) {
                console.warn('Error unmounting cell renderer:', e);
            }
        });
        cellRendererInstances.clear();
    });

    function onOpenClick(studyId: string) {
        navigateTo("study", studyId);
    }

    function onEditClick(studyData: any) {
        editObject("study", studyData);
        fetchStudies();
    }

    function onCopyClick(studyData: Study) {
        if (!studyData?.id) return;
        const existingNames = studiesData.map((study) => study.name).filter(Boolean);
        const existingSiteNumbers = studiesData
            .map((study) => study.siteNumber || "")
            .filter((value) => value.trim() !== "");
        const copiedName = ensureUniqueCopyLabel(studyData.name || "Study", existingNames);
        const copiedSiteNumber = ensureUniqueCopyLabel(studyData.siteNumber || "", existingSiteNumbers);
        const copyPayload = {
            ...studyData,
            id: "",
            name: copiedName,
            siteNumber: copiedSiteNumber,
            sourceStudyId: studyData.id
        };
        openObjectDrawer("study", "copy", copyPayload);
    }

    function handleNewStudy() {
        addMenuOpen = false;
        addObject("study");
    }

    function handleTemplateClick(template: { id: string; label: string; sourceStudyId: string }) {
        addMenuOpen = false;
        const sourceStudyId = template.sourceStudyId || studiesData[0]?.id;
        if (!sourceStudyId) {
            console.warn("[StudyGrid] No template source study and no studies available");
            return;
        }
        const copyPayload = {
            id: "",
            name: "",
            title: "",
            status: "Planning",
            phase: "",
            therapeuticArea: "",
            currentProtocol: "",
            siteNumber: "",
            sourceStudyId
        };
        openObjectDrawer("study", "copy", copyPayload);
    }

    function onStudyChanged() {
        fetchStudies();
    }

    // Delete study confirmation handlers
    async function handleDeleteStudy(studyData: Study, triggerElement: HTMLElement) {
        if (!studyData?.id) return;
        // Close any existing delete confirm popover
        handleDeleteStudyCancel();
        
        // Store study data and trigger element
        deleteConfirmStudyData = studyData;
        deleteConfirmTriggerElement = triggerElement;
        
        // Create container and mount component
        deleteConfirmContainer = document.createElement('div');
        document.body.appendChild(deleteConfirmContainer);
        
        // Dynamic import to avoid module loading issues
        const { default: DeleteConfirmPopover } = await import("../../popovers/DeleteConfirmPopover.svelte");
        
        deleteConfirmInstance = mount(DeleteConfirmPopover, {
            target: deleteConfirmContainer,
            props: {
                open: true,
                triggerElement: deleteConfirmTriggerElement,
                itemName: studyData.name || '',
                itemType: 'study',
                onClose: handleDeleteStudyCancel,
                onConfirm: handleDeleteStudyConfirm
            }
        });
    }
    
    function handleDeleteStudyCancel() {
        if (deleteConfirmInstance) {
            try {
                unmount(deleteConfirmInstance);
            } catch (e) {
                console.warn('[StudyGrid] Error unmounting delete confirm popover:', e);
            }
            deleteConfirmInstance = null;
        }
        if (deleteConfirmContainer && deleteConfirmContainer.parentNode) {
            deleteConfirmContainer.parentNode.removeChild(deleteConfirmContainer);
            deleteConfirmContainer = null;
        }
        deleteConfirmStudyData = null;
        deleteConfirmTriggerElement = null;
    }
    
    async function handleDeleteStudyConfirm() {
        if (!deleteConfirmStudyData?.id) {
            handleDeleteStudyCancel();
            return;
        }
        
        try {
            const success = await dataStore.deleteStudy(deleteConfirmStudyData.id);
            handleDeleteStudyCancel();
            if (success) {
                await fetchStudies(); // Reload data after deletion
            }
        } catch (error) {
            console.error('[StudyGrid] Error deleting study:', error);
            handleDeleteStudyCancel();
        }
    }

    // Store component instances for cleanup
    const cellRendererInstances = new Map<HTMLElement, any>();

    function createNameCell(params: any) {
        // Create a temporary container for mounting
        const tempContainer = document.createElement("div");
        
        // Mount Svelte component - it creates its root element inside tempContainer
        const component = mount(StudyNameCell, {
            target: tempContainer,
            props: {
                params: params,
                onEdit: onEditClick,
                onCopy: onCopyClick,
                onDelete: (studyData: Study, triggerElement: HTMLElement) => handleDeleteStudy(studyData, triggerElement)
            }
        });
        
        // Get the actual root element created by the component (first child)
        const rootElement = tempContainer.firstElementChild as HTMLElement;
        
        if (!rootElement) {
            // Fallback: return container with text if component didn't render
            tempContainer.textContent = params.data?.name || '';
            return tempContainer;
        }
        
        // Store component for cleanup
        cellRendererInstances.set(rootElement, { component, tempContainer });
        
        // Return the component's root element directly
        return rootElement;
    }

    async function refreshStudies() {
        console.log("Refreshing studies");
        if (gridApi) gridApi.setGridOption("loading", true);
        await dataStore.getStudies(adminMode);
        // updateGridData() is not needed; debounced effect will handle
    }

    function onGlobalFilter(event: Event) {
        const target = event.target as HTMLInputElement;
        filterValue = target.value;
        if (gridApi) {
            gridApi.setGridOption("quickFilterText", filterValue);
        }
    }

    function clearSearch() {
        filterValue = "";
        if (gridApi) {
            gridApi.setGridOption("quickFilterText", "");
        }
    }

    function stateEquals(a: any[], b: any[]): boolean {
        if (!a || !b || a.length !== b.length) return false;
        const mapB = new Map(b.map(col => [col.colId, col]));
        for (const colA of a) {
            const colB = mapB.get(colA.colId);
            if (!colB) return false;
            const props = ["rowGroup", "rowGroupIndex", "sort", "sortIndex", "hide", "pinned"];
            for (const p of props) {
                if ((colA as any)[p] !== (colB as any)[p]) return false;
            }
        }
        return true;
    }

    function onViewSelect(event) {
        const newView = event.target.value;
        if (hasUnsavedChanges) {
            pendingViewChange = newView;
            confirmUnsavedOpen = true;
        } else {
            applyView(newView);
            refreshStudies();
        }
    }

    function handleConfirmSave() {
        if (pendingViewChange) {
            if (selectedView === 'default') {
                // Save as new view
                saveDialogOpen = true;
                // After saveDialogOpen, in handleSaveView, apply pendingViewChange
            } else {
                // Save current view
                handleSave();
                applyView(pendingViewChange);
                refreshStudies();
            }
        }
        confirmUnsavedOpen = false;
        pendingViewChange = null;
    }

    function handleConfirmDiscard() {
        if (pendingViewChange) {
            applyView(pendingViewChange);
            refreshStudies();
        }
        confirmUnsavedOpen = false;
        pendingViewChange = null;
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
</svelte:head>

<div class="grid-toolbar">
  <div class="left-side">
    <Popover
      open={addMenuOpen}
      onOpenChange={(e) => (addMenuOpen = e.open)}
      positioning={{ placement: "bottom-start" }}
      triggerBase="p-0"
      contentBase="add-study-menu popover-content card p-2 min-w-[200px]"
    >
      {#snippet trigger()}
        <button type="button" class="standard-button primary inverted" aria-label="Add Study" aria-haspopup="menu" aria-expanded={addMenuOpen}>
          <IconPlus size="16" />Add Study <IconChevronDown size="14" class="add-study-chevron" />
        </button>
      {/snippet}
      {#snippet content()}
        <div class="add-study-menu-items">
          <button type="button" class="add-study-menu-item" onclick={handleNewStudy}>
            New Study
          </button>
          <div class="add-study-menu-separator" role="separator"></div>
          <div class="add-study-menu-header">Templates:</div>
          {#each studyTemplates as template}
            <button type="button" class="add-study-menu-item" onclick={() => handleTemplateClick(template)}>
              {template.label}
            </button>
          {/each}
        </div>
      {/snippet}
    </Popover>
    <div class="search-container">
        <input type="text" placeholder="Quick filter..." class="quick-input-field" value={filterValue} oninput={onGlobalFilter} />
        {#if filterValue}
            <button type="button" class="clear-search-button" onclick={clearSearch}>×</button>
        {/if}
    </div>
    <button type="button" class="grid-button green-button" onclick={refreshStudies} title="Refresh" aria-label="Refresh">
        <IconRefresh size={16} />
    </button>
  </div>
</div>

<div id="studyGrid" class="{gridTheme} ag-grid"></div>
<SaveViewDialog
    open={saveDialogOpen}
    onsave={handleSaveView}
    oncancel={handleCancelSaveView}
/>
<ConfirmUnsavedDialog
    open={confirmUnsavedOpen}
    on:save={handleConfirmSave}
    on:discard={handleConfirmDiscard}
/>

<style>
    :global(.add-study-menu) {
        background: var(--dropdown-bg, #23272f) !important;
    }
    .add-study-chevron {
        margin-left: 2px;
        vertical-align: middle;
        opacity: 0.9;
    }
    .add-study-menu-items {
        display: flex;
        flex-direction: column;
        gap: 0;
    }
    .add-study-menu-item {
        text-align: left;
        padding: 8px 16px;
        background: none;
        border: none;
        cursor: pointer;
        width: 100%;
        font-size: inherit;
        color: var(--dropdown-fg, #fff);
    }
    .add-study-menu-item:hover {
        background: var(--dropdown-hover, #2a2e38);
    }
    .add-study-menu-separator {
        height: 1px;
        background: var(--dropdown-hover, #2a2e38);
        margin: 4px 0;
    }
    .add-study-menu-header {
        padding: 6px 16px 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--dropdown-fg, #fff);
    }
</style>

