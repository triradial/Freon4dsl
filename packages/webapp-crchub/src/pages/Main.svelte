<script lang="ts">
    import { onMount, SvelteComponent, setContext } from "svelte";
    import { ROUTE } from "../constants/routeConstants";
    import { LABEL } from "../constants/labelConstants";

    import { getStudy, type Study, getPatient, type Patient } from "../services/dataStore";
    import { addDrawer, setDrawerVisibility } from "../services/sideDrawerStore";

    import NavBar from "../components/common/NavBar.svelte";
    import Breadcrumb from "../components/common/Breadcrumb.svelte";
    import { currentRoute, type RouteData } from "../services/routeStore";

    import SideDrawerSystem from "../components/common/SideDrawerSystem.svelte";
    import FavoritesDrawer from "../components/drawers/FavoritesDrawer.svelte";
    import StudyTimelineChartDrawer from "../components/drawers/StudyTimelineChartDrawer.svelte";
    import StudyTimelineTableDrawer from "../components/drawers/StudyTimelineTableDrawer.svelte";
    import DSLErrorsDrawer from "../components/drawers/DSLErrorsDrawer.svelte";
    import HelpDrawer from "../components/drawers/HelpDrawer.svelte";

    import ObjectDrawerSystem from "../components/common/ObjectDrawerSystem.svelte";
    import { addObject, editObject } from "../services/objectDrawerStore";

    import HomeContent from "../content/Home.svelte";
    import StudiesContent from "../content/Studies.svelte";
    import PatientsContent from "../content/Patients.svelte";
    import StudyContent from "../content/Study.svelte";
    import PatientContent from "../content/Patient.svelte";
    import Availability from "../content/Availability.svelte";

    import { faHeart, faTableList, faTimeline, faTriangleExclamation, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

    let contentComponent: typeof SvelteComponent;
    let breadcrumbItems: { label: string; href?: string }[] = [];

    setContext('addObject', addObject);
    setContext('editObject', editObject);

    onMount(() => {
        addDrawer({ key: "help", icon: faInfoCircle, component: HelpDrawer, title: "Help", description: "Help for application.", supportsRefresh: false, defaultWidth: 900 });
        addDrawer({ key: "favorites", icon: faHeart, component: FavoritesDrawer, title: "Favorites", description: "Manage your favorite studies, patients, and tasks.", supportsRefresh: true, defaultWidth: 400 });
        addDrawer({ key: "dslErrors", icon: faTriangleExclamation, component: DSLErrorsDrawer, title: "Errors", description: "View the errors in the study design.", supportsRefresh: true, defaultWidth: 800 });
        addDrawer({ key: "studyTimelineTable", icon: faTableList, component: StudyTimelineTableDrawer, title: "Study Timeline Table", description: "View the timeline as a table for this study.", supportsRefresh: true, defaultWidth: 600 });
        addDrawer({ key: "studyTimelineChart", icon: faTimeline, component: StudyTimelineChartDrawer, title: "Study Timeline Chart", description: "View the timeline as a chart for this study.", supportsRefresh: true, defaultWidth: 800 });
        setContent($currentRoute);
        setDrawerVisibility("help", true);
        setDrawerVisibility("favorites", true);
    });

    async function setContent(route: RouteData) {
        const routeName = route.name.toLowerCase();
        const id = route.params?.id;
        let study: Study | undefined;
        let studyId: string;
        let studyName: string;
        let patient: Patient | undefined;
        let patientId: string;
        let patientName: string;
        switch (routeName) {
            case ROUTE.HOME:
                contentComponent = HomeContent as typeof SvelteComponent;
                breadcrumbItems = [];
                break;
            case ROUTE.STUDIES:
                contentComponent = StudiesContent as typeof SvelteComponent;
                breadcrumbItems = [{ label: LABEL.STUDIES }];
                break;
            case ROUTE.AVAILABILITY:
                contentComponent = Availability as typeof SvelteComponent;
                breadcrumbItems = [{ label: LABEL.AVAILABILITY }];
                break;
            case ROUTE.PATIENTS:
                contentComponent = PatientsContent as typeof SvelteComponent;
                breadcrumbItems = [{ label: LABEL.PATIENTS }];
                break;
            case ROUTE.STUDY:
                contentComponent = StudyContent as typeof SvelteComponent;
                try {
                    study = await getStudy(id);
                    if (study) {
                        studyName = study.name;
                        breadcrumbItems = [{ label: LABEL.STUDIES, href: "/" + ROUTE.STUDIES }, { label: LABEL.STUDY + ": " + studyName }];
                    } else {
                        throw new Error("Study not found");
                    }
                } catch (error) {
                    console.error("Error fetching study:", error);
                    breadcrumbItems = [{ label: LABEL.STUDIES, href: "/" + ROUTE.STUDIES }, { label: LABEL.STUDY + ": Not Found" }];
                }
                break;
            case ROUTE.PATIENT:
                contentComponent = PatientContent as typeof SvelteComponent;
                patient = await getPatient(id);
                if (patient) {
                    patientName = patient.name;
                    studyId = patient.studyId;
                    study = await getStudy(patient.studyId);
                    if (study) {
                        studyName = study.name;
                        breadcrumbItems = [
                            { label: LABEL.STUDIES, href: "/" + ROUTE.STUDIES },
                            { label: LABEL.STUDY + ": " + studyName, href: "/" + ROUTE.STUDY + "?id=" + studyId },
                            { label: LABEL.PATIENT + ": " + patientName },
                        ];
                    } else {
                        console.error("Study not found for patient:", id);
                        breadcrumbItems = [
                            { label: LABEL.STUDIES, href: "/" + ROUTE.STUDIES },
                            { label: LABEL.PATIENTS, href: "/" + ROUTE.PATIENTS },
                            { label: LABEL.PATIENT + ": " + patientName },
                        ];
                    }
                } else {
                    console.error("Patient not found:", id);
                    breadcrumbItems = [
                        { label: LABEL.STUDIES, href: "/" + ROUTE.STUDIES },
                        { label: LABEL.PATIENTS, href: "/" + ROUTE.PATIENTS },
                        { label: LABEL.PATIENT + ": Not Found" },
                    ];
                }
                break;

            default:
                contentComponent = HomeContent as typeof SvelteComponent;
                breadcrumbItems = [];
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
        <ObjectDrawerSystem />
        <SideDrawerSystem />
    </div>
</div>