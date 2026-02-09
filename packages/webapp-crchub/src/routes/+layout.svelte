<script lang="ts">
    import { FreLogger } from "@freon4dsl/core";
    import { onMount } from "svelte";
    import { get } from 'svelte/store';
    import { page } from '$app/stores';
    import Breadcrumb from '../components/common/Breadcrumb.svelte';
    import LoginPart from '../components/common/LoginPart.svelte';
    import NavBar from '../components/common/NavBar.svelte';
    import ObjectDrawerSystem from "../components/common/ObjectDrawerSystem.svelte";
    import SideDrawerSystem from "../components/common/SideDrawerSystem.svelte";
    import SchemaMismatchDialog from "../components/dialogs/SchemaMismatchDialog.svelte";
    import PasteDuplicatesDialog from "../components/dialogs/PasteDuplicatesDialog.svelte";
    import DSLErrorsDrawer from "../components/drawers/DSLErrorsDrawer.svelte";
    import FavoritesDrawer from "../components/drawers/FavoritesDrawer.svelte";
    import HelpDrawer from "../components/drawers/HelpDrawer.svelte";
    import PatientStudyTimelineChartDrawer from "../components/drawers/PatientStudyTimelineChartDrawer.svelte";
    import PatientsTimelineChartDrawer from "../components/drawers/PatientsTimelineChartDrawer.svelte";
    import StaffAvailabilityDrawer from "../components/drawers/StaffAvailabilityDrawer.svelte";
    import StudyChecklistDrawer from "../components/drawers/StudyChecklistDrawer.svelte";
    import StudyTimelineTableDrawer from "../components/drawers/StudyTimelineTableDrawer.svelte";
    import VisitChecklistDrawer from "../components/drawers/VisitChecklistDrawer.svelte";
    import "../init.ts";
    import { dataStore } from "../services/data/data-store.js";
    import { isAuthenticated } from "../services/security/auth.js";
    import { addDrawer, drawerStore } from '../services/stores/side-drawer-store.js';
    import { objectDrawerStore } from '../services/stores/object-drawer-store.js';
    import { themeBundle } from "../services/stores/theme-store.js";
    import { userStore } from "../services/stores/users-store.js";
    import version from '../version.txt?raw';
    import { adminModeStore } from "../services/stores/admin-mode-store.js";
    import { staffAvailabilityStore } from "../services/stores/staff-availability-store.js";
// @ts-ignore
    import { Calendar as IconCalendar, CheckSquare as IconCheckSquare, ClipboardCheck as IconClipboardCheck, Heart as IconHeart, Info as IconInfo, SquareChartGantt as IconSquareChartGantt, Table2 as IconTable2, TriangleAlert as IconTriangleAlert, Users as IconUsers } from '@lucide/svelte';
    
    const LOGGER = new FreLogger("Routing");

    let auth = $derived($isAuthenticated);
    let { children } = $props();
    
    // Hide breadcrumb on home page
    let showBreadcrumb = $derived($page.url.pathname !== '/home');
    
    // Track if any drawer is open for overlay
    let isObjectDrawerOpen = $derived($objectDrawerStore.open);
    let isSideDrawerOpen = $derived($drawerStore.activeDrawer !== null);
    let isAnyDrawerOpen = $derived(isObjectDrawerOpen || isSideDrawerOpen);
    
    $effect(() => {
        if (isAnyDrawerOpen) {
            console.log('Drawer overlay should be visible', { isObjectDrawerOpen, isSideDrawerOpen });
        }
    });

    onMount(() => {
        auth = sessionStorage.getItem("auth") === "true";
        isAuthenticated.set(auth);
        if (auth) {
            userStore.initializeFromStorage();
            // Only initialize admin mode if user is actually a global admin
            // This prevents admin mode from persisting when a non-admin logs in
            const user = get(userStore);
            if (user?.isGlobalAdmin) {
                adminModeStore.initializeFromStorage();
            } else {
                // Disable admin mode if user is not a global admin
                adminModeStore.disable();
            }
            staffAvailabilityStore.initializeFromStorage();
            dataStore.initializeDatastore();

            // Register global drawers
            addDrawer({ key: "help", icon: IconInfo, component: HelpDrawer, title: "Help", description: "Help for application.", supportsRefresh: false, supportsPrint: false, defaultWidth: 900, });
            addDrawer({ key: "favorites", icon: IconHeart, component: FavoritesDrawer, title: "Favorites", description: "Manage your favorite studies, patients, and tasks.", supportsRefresh: true, supportsPrint: false, defaultWidth: 400, });
            addDrawer({ key: "dslErrors", icon: IconTriangleAlert, component: DSLErrorsDrawer, title: "Errors", description: "View the errors in the study design.", supportsRefresh: true, supportsPrint: false, defaultWidth: 800, });
            addDrawer({ key: "studyTimelineTable", icon: IconTable2, component: StudyTimelineTableDrawer, title: "Study Timeline Table", description: "View the timeline as a table for this study.", supportsRefresh: true, supportsPrint: false, defaultWidth: 600, });
            addDrawer({ key: "patientStudyTimelineChart", icon: IconSquareChartGantt, component: PatientStudyTimelineChartDrawer, title: "Study Timeline Chart - Date Selected", description: "View the study timeline chart for the selected date for this patient.", supportsRefresh: true, supportsPrint: false, defaultWidth: 800, });
            addDrawer({ key: "visitChecklist", icon: IconClipboardCheck, component: VisitChecklistDrawer, title: "Visit Checklist", description: "View the checklist for visits scheduled for the selected date.", supportsRefresh: true, supportsPrint: false, defaultWidth: 800, });
            addDrawer({ key: "studyChecklist", icon: IconCheckSquare, component: StudyChecklistDrawer, title: "Study Checklist", description: "View the checklist for this study.", supportsRefresh: true, supportsPrint: true, defaultWidth: 800, });   
            addDrawer({ key: "patientTimelineChart", icon: IconCalendar, component: PatientsTimelineChartDrawer, title: "Patient Timeline", description: "View patient timelines and visit schedules for this study.", supportsRefresh: true, supportsPrint: false, defaultWidth: 800, });
            addDrawer({ key: "staffAvailability", icon: IconUsers, component: StaffAvailabilityDrawer, title: "Staff Availability", description: "View the availability of staff for this study.", supportsRefresh: true, supportsPrint: false, defaultWidth: 800, });

            // Debug: log all drawers after registration
            LOGGER.log("All drawers after registration: " + JSON.stringify(get(drawerStore).drawers));
        }
    });

    $effect(() => {
        LOGGER.log('root +layout loaded');
    });
</script>

<svelte:head>
    <title>CRCHub v{version.trim()}</title>
    <link rel="stylesheet" href="/styles/tailwind.css" />
    <link rel="stylesheet" href="/styles/github-markdown.css" />
    <link rel="stylesheet" href="/styles/bundle-{$themeBundle}.css" />
</svelte:head>

{#if auth}
    <div id="app-container">
        <appbar>
            <NavBar />
        </appbar>
        <div id="content-container">
            {#if showBreadcrumb}
                <Breadcrumb />
            {/if}
            {@render children()}
            <ObjectDrawerSystem />
            <SideDrawerSystem />
        </div>
    </div>
    {#if isAnyDrawerOpen}
        <div class="drawer-overlay"></div>
    {/if}
    <!-- Schema mismatch popup for when models with older schema are loaded -->
    <SchemaMismatchDialog />
    <!-- Paste duplicates popup for when duplicate items are skipped during paste -->
    <PasteDuplicatesDialog />
{:else}
    <div class="login-page">
        <div class="login-container">
            <LoginPart />
        </div>
    </div>
{/if} 