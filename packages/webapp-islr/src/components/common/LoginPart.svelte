<script lang="ts">
    import { authenticate, isAuthenticated, redirectUrl } from "../../services/security/auth.js";
    import { writable } from "svelte/store";
    import ToastWarning from "../common/ToastWarning.svelte";
    import { goto } from '$app/navigation';

    let username = $state("");
    let password = $state("");
    let showError = writable(false);

    const submitForm = async (event: Event) => {
        event.preventDefault();
        let url: string = "/";
        const unsubscribe = redirectUrl.subscribe((value) => {
            url = value || "/";
        });
        unsubscribe(); // Unsubscribe to avoid memory leaks
        const auth = await authenticate(username, password);
        if (!auth) {
            showError.set(true);
        } else {
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
        }
    };

    const resetError = () => {
        showError.set(false);
    };
</script>

<div id="login" style="width:24rem">
    <div>
        <div class="flex justify-center items-center">
            <img class="w-16 h-16 mr-2" src="/images/logo_grey.svg" alt="logo" />
            <h1 style="font-size: 2rem; color: white;">
                <span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span>
            </h1>
        </div>
        <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
            <form class="flex flex-col space-y-6" onsubmit={submitForm}>
                <input 
                    bind:value={username} 
                    type="text" 
                    name="username" 
                    placeholder="username" 
                    required 
                    oninput={resetError}
                    class="input text-white-500 dark:text-white-500"
                />
                <input 
                    bind:value={password} 
                    type="password" 
                    name="password" 
                    placeholder="password" 
                    required 
                    oninput={resetError}
                    class="input text-white-500 dark:text-white-500"
                />
                <div class="flex items-start">
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" class="checkbox" />
                        <span>Remember me</span>
                    </label>
                    <a href="/" class="ml-auto text-sm text-white-500 hover:underline dark:text-white-500">Forgot password?</a>
                </div>
                <button 
                    type="submit" 
                    class="btn preset-filled-primary-500 w-full text-white-500 dark:text-white-500"
                >
                    Sign in
                </button>
                <p class="text-sm font-light text-white-500 dark:text-white-500">
                    Dont have an account yet?
                    <a href="/" class="font-medium text-white-500 hover:underline dark:text-white-500">Sign up</a>
                </p>
            </form>
            {#if $showError}
                <ToastWarning message="Incorrect username or password. Please try again." type="error" />
            {/if}
        </div>
    </div>
</div>
