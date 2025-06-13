<script lang="ts">
    import { onMount } from "svelte";
    import { get } from 'svelte/store';
    import { isAuthenticated } from "../services/security/auth.js";
    import { userStore } from "../services/stores/users-store.js";
    import { dataStore } from "../services/data/data-store.js";
    import { theme } from "../services/stores/theme-store.js";
    import LoginPart from '../components/common/LoginPart.svelte';
    import NavBar from '../components/common/NavBar.svelte';
    import Breadcrumb from '../components/common/Breadcrumb.svelte';
    import ObjectDrawerSystem from "../components/common/ObjectDrawerSystem.svelte";
    import SideDrawerSystem from "../components/common/SideDrawerSystem.svelte";
    import { addDrawer, setDrawerVisibility } from '../services/stores/side-drawer-store.js';
    import { drawerStore } from '../services/stores/side-drawer-store.js';
    import FavoritesDrawer from "../components/drawers/FavoritesDrawer.svelte";
    import StudyTimelineChartDrawer from "../components/drawers/StudyTimelineChartDrawer.svelte";
    import StudyTimelineTableDrawer from "../components/drawers/StudyTimelineTableDrawer.svelte";
    import DSLErrorsDrawer from "../components/drawers/DSLErrorsDrawer.svelte";
    import HelpDrawer from "../components/drawers/HelpDrawer.svelte";
    // @ts-ignore
    import { Heart as IconHeart, SquareChartGantt as IconSquareChartGantt,  Table2 as IconTable2, TriangleAlert as IconTriangleAlert,  Info as IconInfo } from '@lucide/svelte';
    
    let auth = $derived($isAuthenticated);
    let { children } = $props();

    onMount(() => {
        auth = sessionStorage.getItem("auth") === "true";
        isAuthenticated.set(auth);
        if (auth) {
            userStore.initializeFromStorage();
            dataStore.initializeDatastore();

            // Register global drawers
            addDrawer({
                key: "help",
                icon: IconInfo,
                component: HelpDrawer,
                title: "Help",
                description: "Help for application.",
                supportsRefresh: false,
                defaultWidth: 900,
            });
            addDrawer({
                key: "favorites",
                icon: IconHeart,
                component: FavoritesDrawer,
                title: "Favorites",
                description: "Manage your favorite studies, patients, and tasks.",
                supportsRefresh: true,
                defaultWidth: 400,
            });
            addDrawer({
                key: "dslErrors",
                icon: IconTriangleAlert,
                component: DSLErrorsDrawer,
                title: "Errors",
                description: "View the errors in the study design.",
                supportsRefresh: true,
                defaultWidth: 800,
            });
            addDrawer({
                key: "studyTimelineTable",
                icon: IconSquareChartGantt ,
                component: StudyTimelineTableDrawer,
                title: "Study Timeline Table",
                description: "View the timeline as a table for this study.",
                supportsRefresh: true,
                defaultWidth: 600,
            });
            addDrawer({
                key: "studyTimelineChart",
                icon: IconTable2,
                component: StudyTimelineChartDrawer,
                title: "Study Timeline Chart",
                description: "View the timeline as a chart for this study.",
                supportsRefresh: true,
                defaultWidth: 800,
            });
            // Debug: log all drawers after registration
            console.log("All drawers after registration:", get(drawerStore).drawers);
        }
    });

    $effect(() => {
        console.log('+layout.svelte loaded');
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="/styles/bundle-{$theme}.css" />
</svelte:head>

{#if auth}
    <div id="app-container">
        <appbar>
            <NavBar />
        </appbar>
        <div id="content-container">
            <Breadcrumb />
            {@render children()}
            <ObjectDrawerSystem />
            <SideDrawerSystem />
        </div>
    </div>
{:else}
    <div class="login-page">
        <div class="login-container">
            <LoginPart />
        </div>
    </div>
{/if} 