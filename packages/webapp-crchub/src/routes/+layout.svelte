<script lang="ts">
    import { onMount } from "svelte";
    import { isAuthenticated, redirectUrl } from "../services/security/auth.js";
    import { userStore } from "../services/stores/users-store.js";
    import { dataStore } from "../services/data/data-store.js";
    import { theme } from "../services/stores/theme-store.js";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { initializeApp } from "../services/initialization/app-initialization.js";

    let auth = false;

    // Step 1: Check auth state from session storage immediately (synchronous)
    auth = sessionStorage.getItem("auth") === "true";
    isAuthenticated.set(auth);

    // Step 2: Initialize app if authenticated
    if (auth) {
        initializeApp();
    }

    $effect(() => {
        isAuthenticated.subscribe((value) => {
            auth = value;
            sessionStorage.setItem("auth", auth.toString());

            if (!auth) {
                if ($page.url.pathname !== "/login") {
                    redirectUrl.set($page.url.pathname + $page.url.search);
                    goto("/login");
                }
            } else {
                const redirect = $redirectUrl;
                if (redirect && redirect !== "/login") {
                    redirectUrl.set("");
                    goto(redirect);
                }
            }
        });
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="/assets/styles/bundle-{$theme}.css" />
</svelte:head>

<slot /> 