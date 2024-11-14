<script lang="ts">
    import { Router, Route } from "svelte-routing";
    import { ROUTE, VALID_ROUTES, VALID_ROUTES_WITH_ID, type ValidRoute, type ValidRouteWithId } from "./constants/routeConstants.js";
    import Main from "./pages/Main.svelte";
    import Login from "./pages/Login.svelte";
    import { onMount } from "svelte";
    import { isAuthenticated, redirectUrl } from "./services/auth.js";
    import { updateCurrentRoute } from "./services/routeAction.js";
    import { theme } from "./services/themeStore.js";
    import { userStore } from "./services/userStore.js";
    import { dataStore } from "./services/dataStore.js";

    let auth = false;

    // Step 1: Check auth state from session storage immediately (synchronous)
    auth = sessionStorage.getItem("auth") === "true";
    isAuthenticated.set(auth); // Set the store value to match session storage

    // Step 2: Restore user data from session storage immediately (synchronous)
    if (auth) {
        userStore.initializeFromStorage();
        dataStore.initializeDatastore();
    }

    // Step 3: Validate the restored session (asynchronous)
    // onMount(async () => {
    //     if (auth) {
    //         try {
    //             // Validate token with backend
    //             const isValid = await validateSession();
    //             if (!isValid) {
    //                 auth = false;
    //                 isAuthenticated.set(false);
    //                 sessionStorage.removeItem("auth");
    //                 userStore.clearUser();
    //             }
    //         } catch (error) {
    //             console.error("Session validation failed:", error);
    //             auth = false;
    //             isAuthenticated.set(false);
    //             sessionStorage.removeItem("auth");
    //             userStore.clearUser();
    //         }
    //     }
    // });

    $: {
        isAuthenticated.subscribe((value) => {
            auth = value;
            console.log("auth:", auth);
            sessionStorage.setItem("auth", auth.toString());

            let currentRouteName = window.location.pathname.split("/")[1] || "";
            let currentId = window.location.search.split("?")[1]?.split("=")[1] ?? undefined;

            if (!auth) {
                if (VALID_ROUTES.includes(currentRouteName as ValidRoute) && currentRouteName !== ROUTE.LOGIN) {
                    let currentUrl = "/" + currentRouteName;
                    if (VALID_ROUTES_WITH_ID.includes(currentRouteName as ValidRouteWithId)) {
                        currentUrl += "?id=" + currentId;
                    }
                    redirectUrl.set(currentUrl);
                } else {
                    redirectUrl.set("/");
                }
                updateCurrentRoute(ROUTE.LOGIN);
            } else {
                redirectUrl.subscribe((url) => {
                    let routeName: string = "";
                    let id: string | undefined;
                    if (currentRouteName === ROUTE.LOGIN) {
                        redirectUrl.set("");
                        if (url) {
                            if (url !== "/" && url !== "undefined") {
                                routeName = url.split("?")[0].replace(/^\//, "");
                                if (VALID_ROUTES.includes(routeName as ValidRoute)) {
                                    id = url.split("?")[1]?.split("=")[1] ?? undefined;
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

<svelte:head>
    <link rel="stylesheet" href="/assets/styles/bundle-{$theme}.css" />
</svelte:head>

<Router>
    {#if auth}
        <Route path="/*" component={Main} />
    {:else}
        <Route component={Login} />
    {/if}
</Router>
