<script lang="ts">
    import { authenticate, isAuthenticated, redirectUrl } from "../../services/security/auth.js";
    import { goto } from '$app/navigation';
    import version from '../../version.txt?raw';
    import { CircleX as ErrorIcon } from '@lucide/svelte';

    let username = $state("");
    let password = $state("");
    let showError = $state(false);
    let errorMessage = $state("Incorrect username or password. Please try again.");
    let isLoading = $state(false);

    const submitForm = async (event: Event) => {
        event.preventDefault();
        isLoading = true;
        showError = false;
        
        try {
            let url: string = "/";
            const unsubscribe = redirectUrl.subscribe((value) => {
                url = value || "/";
            });
            unsubscribe(); // Unsubscribe to avoid memory leaks
            
            console.log('[LoginPart] Attempting authentication...');
            const result = await authenticate(username, password);
            console.log('[LoginPart] Authentication result:', result);
            
            if (!result.success) {
                console.log('[LoginPart] Authentication failed, showing error');
                errorMessage = result.errorMessage || 'Incorrect username or password. Please try again.';
                showError = true;
                isLoading = false;
            } else {
                console.log('[LoginPart] Authentication successful, redirecting...');
                sessionStorage.setItem("auth", "true");
                isAuthenticated.set(true);
                // Restore intended route if present
                const intended = sessionStorage.getItem('intendedRoute');
                if (intended && intended !== '/login') {
                    sessionStorage.removeItem('intendedRoute');
                    goto(intended);
                } else {
                    goto(url);
                }
                // Keep loading state true during navigation
            }
        } catch (error) {
            console.error('[LoginPart] Authentication error caught:', error);
            errorMessage = 'Server not responding. Please try again later.';
            showError = true;
            isLoading = false;
        }
    };

    const resetError = () => {
        showError = false;
    };
</script>

<div id="login" style="width:24rem; position: relative;">
    <div>
        <div class="flex justify-center items-center">
            <img class="w-16 h-16 mr-2" src="/images/logo_grey.svg" alt="logo" />
            <h1 style="font-size: 2rem; color: white;">
                <span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span>
                <div class="copyright-text">Version {version}</div>
            </h1>
        </div>
        <div class="p-6 space-y-4 md:space-y-6 sm:p-8 relative">
            <form class="flex flex-col space-y-6 transition-opacity duration-200 {isLoading ? 'opacity-50' : ''}" onsubmit={submitForm}>
                <input bind:value={username} type="text" name="username" placeholder="username" required oninput={resetError} disabled={isLoading} class="input text-white-500 dark:text-white-500" />
                <input bind:value={password} type="password" name="password" placeholder="password" required oninput={resetError} disabled={isLoading} class="input text-white-500 dark:text-white-500" />
                <button type="submit" disabled={isLoading} class="btn w-full">
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
            {#if isLoading}
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div class="spinner"></div>
                </div>
            {/if}
            <div class="flex flex-col items-center w-full gap-2">
                <div class="copyright-text">Copyright © 2026 Triradial. All rights reserved.</div>
            </div>
        </div>
    </div>
    {#if showError}
        <div class="error-message-absolute">
            <ErrorIcon class="error-icon" size="24" />
            <p>{errorMessage}</p>
        </div>
    {/if}
</div>
