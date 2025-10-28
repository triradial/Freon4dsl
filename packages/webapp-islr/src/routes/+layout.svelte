<script lang="ts">
    import "../init.ts";
    import { onMount } from "svelte";
    import { FreLogger } from "@freon4dsl/core";
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
    import { addDrawer } from '../services/stores/side-drawer-store.js';
    import { drawerStore } from '../services/stores/side-drawer-store.js';
    import FavoritesDrawer from "../components/drawers/FavoritesDrawer.svelte";
    import DSLErrorsDrawer from "../components/drawers/DSLErrorsDrawer.svelte";
    import HelpDrawer from "../components/drawers/HelpDrawer.svelte";
    // @ts-ignore
    import { Heart as IconHeart, TriangleAlert as IconTriangleAlert, Info as IconInfo } from '@lucide/svelte';
    
    const LOGGER = new FreLogger("Routing");

    let auth = $derived($isAuthenticated);
    let { children } = $props();

    onMount(() => {
        auth = sessionStorage.getItem("auth") === "true";
        isAuthenticated.set(auth);
        if (auth) {
            userStore.initializeFromStorage();
            dataStore.initializeDatastore();

            // Register global drawers
            addDrawer({ key: "help", icon: IconInfo, component: HelpDrawer, title: "Help", description: "Help for application.", supportsRefresh: false, supportsPrint: false, defaultWidth: 900, });
            addDrawer({ key: "favorites", icon: IconHeart, component: FavoritesDrawer, title: "Favorites", description: "Manage your favorite projects and tasks.", supportsRefresh: true, supportsPrint: false, defaultWidth: 400, });
            addDrawer({ key: "dslErrors", icon: IconTriangleAlert, component: DSLErrorsDrawer, title: "Errors", description: "View the errors in the project design.", supportsRefresh: true, supportsPrint: false, defaultWidth: 800, });

            // Debug: log all drawers after registration
            LOGGER.log("All drawers after registration: " + JSON.stringify(get(drawerStore).drawers));
        }
    });

    $effect(() => {
        LOGGER.log('root +layout loaded');
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