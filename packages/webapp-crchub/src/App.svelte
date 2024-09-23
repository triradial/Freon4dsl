<script lang="ts">
    import { Router, Route, navigate } from "svelte-routing";
    import { ROUTE, VALID_ROUTES, type ValidRoute } from "./constants/routeConstants";
    import Main from "./pages/Main.svelte";
    import Login from "./pages/Login.svelte";
    import NotFound from "./pages/Uknown.svelte";
    import { onMount } from "svelte";
    import { isAuthenticated, redirectUrl } from "./services/auth";
    import { currentRoute } from "./services/routeStore";
    import { updateCurrentRoute, navigateTo } from "./services/routeAction";

    let auth = false;

    onMount(() => {
        const storedAuth = sessionStorage.getItem("auth");
        if (storedAuth) {
            auth = storedAuth === "true";
        }

        // window.addEventListener("navigateTo", (event: CustomEvent) => {
        //     navigateTo(event.detail.name, event.detail.params);
        // });
    });
    
        
    $: {
        isAuthenticated.subscribe((value) => {
            auth = value;
            console.log("auth:", auth);
            sessionStorage.setItem("auth", auth.toString());
            const currentPath = window.location.pathname;
            let currentRouteName = currentPath.split('?')[0].replace(/^\//, '');
            const currentId = (currentPath.split('?')[1]?.split('=')[1] ?? undefined);
            if (!auth) {
                if (VALID_ROUTES.includes(currentRouteName as ValidRoute) && currentRouteName !== ROUTE.LOGIN) {
                    redirectUrl.set(currentPath);
                } else {
                    redirectUrl.set("/");
                }
                updateCurrentRoute(ROUTE.LOGIN);
            } else {
                redirectUrl.subscribe((url) => {
                    let routeName:string = "";
                    let id:string | undefined;
                    if (currentRouteName === ROUTE.LOGIN) {
                        redirectUrl.set(""); 
                        if (url) {
                            if (url !== '/' && url !== 'undefined') {
                                routeName = url.split('?')[0].replace(/^\//, '');
                                if (VALID_ROUTES.includes(routeName as ValidRoute)) {
                                    id = (url.split('?')[1]?.split('=')[1] ?? undefined);
                                } else {
                                    routeName = ROUTE.HOME;
                                }
                            } else {
                                routeName = ROUTE.HOME;
                            }
                        } else {
                            routeName = ROUTE.LOGIN;
                            auth = false;
                        }
                    } else {
                        routeName = currentRouteName;
                        if (VALID_ROUTES.includes(routeName as ValidRoute)) {
                            id = currentId;
                        } else {
                            routeName = ROUTE.HOME;
                        }
                    }

                    if (id) {
                        updateCurrentRoute(routeName, id);
                    } else {
                        updateCurrentRoute(routeName);
                    }
                });
            }
        });
    }

</script>

<Router>
    {#if auth}
        <Route path="/*" component={Main} />
    {:else}
        <Route component={Login} />
    {/if}
</Router>