<script lang="ts">
    import { onMount, createEventDispatcher, SvelteComponent } from "svelte";
    import { ROUTE } from "../constants/routeConstants";
    import { LABEL } from "../constants/labelConstants";

    import NavBar from "../components/common/NavBar.svelte";
    import SideNav from "../components/common/SideNav.svelte";
    import Breadcrumb from "../components/common/Breadcrumb.svelte";
    import { currentRoute, type RouteData } from "../services/routeStore";

    import Home from "../content/Home.svelte";
    import Studies from "../content/Studies.svelte";
    import Patients from "../content/Patients.svelte";
    import Study from "../content/Study.svelte";
    import Availability from "../content/Availability.svelte";

    let contentComponent: typeof SvelteComponent;
    let breadcrumbItems: { label: string; href?: string }[] = [];

    onMount(() => {
        setContent($currentRoute);
    });

    function setContent(route: RouteData) {
        const routeName = route.name.toLowerCase();
        switch (routeName) {
            case ROUTE.HOME:
                contentComponent = Home as typeof SvelteComponent;
                breadcrumbItems = [];
                break;
            case ROUTE.STUDIES:
                contentComponent = Studies as typeof SvelteComponent;
                breadcrumbItems = [{ label: LABEL.STUDIES }];
                break;
            case ROUTE.AVAILABILITY:
                contentComponent = Availability as typeof SvelteComponent;
                breadcrumbItems = [{ label: LABEL.AVAILABILITY }];
                break;
            case ROUTE.PATIENTS:
                contentComponent = Patients as typeof SvelteComponent;
                breadcrumbItems = [{ label: LABEL.PATIENTS }];
                break;
            case ROUTE.STUDY:
                contentComponent = Study as typeof SvelteComponent;
                const name: string = "Name Lookup";
                breadcrumbItems = [{ label: LABEL.STUDIES, href: "/" + ROUTE.STUDIES }, { label: LABEL.STUDY + ": " + name }];
                break;
            default:
                contentComponent = Home as typeof SvelteComponent;
        }
    }

    $: if ($currentRoute) {
        setContent($currentRoute);
        console.log("Current route changed:", $currentRoute);
    }
</script>

<div id="app-container">
    <appbar>
        <NavBar />
    </appbar>
    <div id="content-container">
        <!-- <appnav id="appnav-component">
            <SideNav />
        </appnav> -->
        <main>
            <Breadcrumb items={breadcrumbItems} />
            {#await contentComponent}
                <p>Loading...</p>
            {:then Component}
                {#if $currentRoute.params?.id}
                    <svelte:component this={Component} id={$currentRoute.params.id} />
                {:else}
                    <svelte:component this={Component} />
                {/if}
            {:catch error}
                <p>Error loading content: {error.message}</p>
            {/await}
        </main>
    </div>
</div>
