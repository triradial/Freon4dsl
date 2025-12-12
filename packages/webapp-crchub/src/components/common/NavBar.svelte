<script lang="ts">
    import { AppBar, Popover, Switch } from '@skeletonlabs/skeleton-svelte';
    import { isAuthenticated } from "../../services/security/auth.js";
    import { goto } from '$app/navigation';
    import { theme } from "../../services/stores/theme-store.js";
    import { ROUTE } from "../../constants/route-constants.js";
    import { LABEL } from "../../constants/label-constants.js";
    import { userStore, type User } from "../../services/stores/users-store.js";
    import { adminModeStore } from "../../services/stores/admin-mode-store.js";
    // @ts-ignore
    import { Sun as IconSun, Moon as IconMoon } from '@lucide/svelte';
    import version from '../../../static/version.txt?raw';

    let user = $derived($userStore);
    let adminMode = $derived($adminModeStore);
    
    $effect(() => {
        console.log('[NavBar] User updated:', user);
        console.log('[NavBar] isGlobalAdmin:', user?.isGlobalAdmin);
    });

    function navTo(route: string) {
        let path = '/';
        if (route && route.toLowerCase() !== 'home') {
            path = '/' + route.toLowerCase();
        }
        goto(path, { invalidateAll: true });
    }

    async function signOut() {
        // Import and call the auth signOut function to properly clear all state
        const { signOut: authSignOut } = await import('../../services/security/auth.js');
        await authSignOut();
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
    let managePopoverOpen = $state(false);
    
    function popoverClose() {
        popoverOpen = false;
    }
    
    function managePopoverClose() {
        managePopoverOpen = false;
    }

    function themeToggle() {
        $theme = $theme === "dark" ? "light" : "dark";
    }

    function toggleAdminMode() {
        adminModeStore.toggle();
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
            <button type="button" onclick={() => navTo(ROUTE.FACILITY)}>{LABEL.FACILITY}</button>
            {#if adminMode}
                <Popover zIndex="900"
                    open={managePopoverOpen}
                    onOpenChange={(e) => (managePopoverOpen = e.open)}
                    positioning={{ placement: 'bottom-start' }}
                    triggerBase="p-0"
                    contentBase="popover-content card p-2 min-w-[160px]"
                >
                    {#snippet trigger()}
                        <button type="button">{LABEL.MANAGE} ▼</button>
                    {/snippet}
                    {#snippet content()}
                        <div class="manage-menu" style="display: flex; flex-direction: column; gap: 0;">
                            <button type="button" class="manage-menu-item" style="text-align: left; padding: 8px 16px; background: none; border: none; color: var(--navbar-text); cursor: pointer; width: 100%;" onclick={() => { navTo(ROUTE.ORGANIZATIONS); managePopoverClose(); }}>
                                {LABEL.ORGANIZATIONS}
                            </button>
                            <button type="button" class="manage-menu-item" style="text-align: left; padding: 8px 16px; background: none; border: none; color: var(--navbar-text); cursor: pointer; width: 100%;" onclick={() => { navTo(ROUTE.PEOPLE); managePopoverClose(); }}>
                                {LABEL.PEOPLE}
                            </button>
                        </div>
                    {/snippet}
                </Popover>
            {/if}
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
            contentBase="user-popover popover-content card p-4"
        >
            {#snippet trigger()}
                <div class="user-avatar-container">
                    <div class="icon-button btn-user">{userInitials}</div>
                    {#if adminMode}
                        <div class="admin-indicator"></div>
                    {/if}
                </div>
            {/snippet}
            {#snippet content()}
                <header class="flex justify-between items-center mb-2">
                    <div class="w-full">
                        <div class="flex items-center justify-between gap-4 mb-3">
                            <span class="block user-name">{user ? user.name : "Unknown"}</span>
                            {#if user?.isGlobalAdmin}
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <span class="user-text">Admin Mode</span>
                                    <input 
                                        type="checkbox" 
                                        checked={adminMode} 
                                        onchange={toggleAdminMode}
                                        class="admin-mode w-4 h-4 cursor-pointer"
                                    />
                                </label>
                            {/if}
                        </div>
                        <span class="block user-text">{user ? user.email : "Unknown"}</span>
                        {#if user?.facility}
                            <span class="block user-text">{user.facility}</span>
                        {:else}
                            <span class="block user-text facility-not-assigned">Facility Not Assigned</span>
                        {/if}
                    </div>
                </header>
                <hr class="my-2" />
                <div class="user-menu mb-4">
                    <button class="px-2 py-1" onclick={signOut} tabindex="0">Sign out</button>
                </div>
                <hr class="my-2" /> 
                <span class="block version-text mt-4">Copyright © 2025 Triradial. All rights reserved.</span>
                <span class="block version-text">CRCHub Version {version.trim()}</span>

            {/snippet}
        </Popover>
    {/snippet}
</AppBar>
