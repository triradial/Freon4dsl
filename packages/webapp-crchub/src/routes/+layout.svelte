<script lang="ts">
    import { onMount } from "svelte";
    import { isAuthenticated } from "../services/security/auth.js";
    import { userStore } from "../services/stores/users-store.js";
    import { dataStore } from "../services/data/data-store.js";
    import { theme } from "../services/stores/theme-store.js";
    import LoginPart from '../components/common/LoginPart.svelte';

    let auth = $derived($isAuthenticated);

    onMount(() => {
        auth = sessionStorage.getItem("auth") === "true";
        isAuthenticated.set(auth);
        if (auth) {
            userStore.initializeFromStorage();
            dataStore.initializeDatastore();
        }
    });

    $effect(() => {
        console.log('+layout.svelte loaded');
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="/assets/styles/bundle-{$theme}.css" />
</svelte:head>

{#if auth}
    <slot />
{:else}
    <div class="login-page">
        <div class="login-container">
            <LoginPart />
        </div>
    </div>
{/if} 