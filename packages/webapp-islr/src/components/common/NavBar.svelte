<script lang="ts">
    import { AppBar, Popover } from '@skeletonlabs/skeleton-svelte';
    import { isAuthenticated } from "../../services/security/auth.js";
    import { goto } from '$app/navigation';
    import { theme } from "../../services/stores/theme-store.js";
    import { ROUTE } from "../../constants/route-constants.js";
    import { LABEL } from "../../constants/label-constants.js";
    import { userStore, type User } from "../../services/stores/users-store.js";
    // @ts-ignore
    import { Sun as IconSun, Moon as IconMoon } from '@lucide/svelte';

    let user = $state<User | null>(null);
    userStore.subscribe((value) => {
        user = value;
    });

    function navTo(route: string) {
        let path = '/';
        if (route && route.toLowerCase() !== 'home') {
            path = '/' + route.toLowerCase();
        }
        goto(path, { invalidateAll: true });
    }

    function signOut() {
        isAuthenticated.set(false);
        sessionStorage.setItem("auth", "false");
        userStore.clearUser();
        popoverOpen = false;
    }

    let isDark = $derived($theme === "dark");

    let userInitials = $derived(user
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
        : "");

    let popoverOpen = $state(false);
    function popoverClose() {
        popoverOpen = false;
    }

    function themeToggle() {
        $theme = $theme === "dark" ? "light" : "dark";
    }
</script>

<AppBar trailSpaceX="gap-1">
    {#snippet lead()}
        <div id="navbar-logo" class="flex items-center">
            <img src="/images/logo_grey.svg" class="me-1 h-6 sm:h-8" alt="CRCHub Logo" />
            <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
                <span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span>
            </span>
        </div>  
        <div class="navbar-commands">
            <button type="button" onclick={() => navTo(ROUTE.HOME)}>{LABEL.HOME}</button>
            <button type="button" onclick={() => navTo(ROUTE.STUDIES)}>{LABEL.STUDIES}</button>
        </div>
    {/snippet}

    {#snippet trail()}
        <div class="flex items-center">
            <button class="icon-button btn-toggle-theme" onclick={themeToggle} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>{#if isDark}<IconSun size={20} />{:else}<IconMoon size={20}    />{/if}</button>
        </div>
        <Popover zIndex="900"
            open={popoverOpen}
            onOpenChange={(e) => (popoverOpen = e.open)}
            positioning={{ placement: 'bottom' }}
            triggerBase="p-0 popover-trigger shadow-none"
            contentBase="popover-content card p-4 max-w-[400px]"
        >
            {#snippet trigger()}
                <div class="icon-button btn-user">{userInitials}</div>
            {/snippet}
            {#snippet content()}
                <header class="flex justify-between items-center mb-2">
                    <div>
                        <span class="block text-xs">{user ? user.name : "Unknown"}</span>
                        <span class="block truncate text-xs">{user ? user.email : "Unknown"}</span>
                    </div>
                </header>
                <div class="user-menu">
                    <button class="px-2 py-1" tabindex="0">Profile</button>
                    <button class="px-2 py-1" tabindex="0">Settings</button>
                    <hr class="my-2" />
                    <button class="px-2 py-1" onclick={signOut} tabindex="0">Sign out</button>
                </div>
            {/snippet}
        </Popover>
    {/snippet}
</AppBar>
