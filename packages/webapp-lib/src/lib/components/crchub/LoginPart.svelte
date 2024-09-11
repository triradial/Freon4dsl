<script>
    import { Button, Checkbox, Input } from "flowbite-svelte";
    import { authenticate, isAuthenticated, redirectUrl } from '../services/auth';
    import { writable } from 'svelte/store';
    import ToastWarning from "./ToastWarning.svelte";
    import { navigate } from 'svelte-routing';
    
    let username = '';
    let password = '';
    let showError = writable(false);

    const submitForm = async (event) => {
        event.preventDefault();
        let url;
        redirectUrl.subscribe(value => { url = value; });
        const credentials = {
            username: username,
            password: password,
        };
        const auth = await authenticate(credentials);
        if (!auth) {
            showError.set(true);
        } else {
            isAuthenticated.set(true);
            sessionStorage.setItem('auth', 'true');
            navigate(url);           
        }
    };

    const resetError = () => {
        showError.set(false);
    };

    showError.subscribe(value => {
        console.log('showError value:', value);
    });
</script>

<div id="login" style="width:24rem">
    <div>
        <div class="flex justify-center items-center">
            <img class="w-16 h-16 mr-2" src="/assets/images/logo_grey.svg" alt="logo" />
            <h1 style="font-size: 2rem; color: white;">
                <span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span>
            </h1> 
        </div>
        <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
            <form class="flex flex-col space-y-6" on:submit={submitForm}>
                <Input bind:value={username} type="text" name="username" placeholder="username" required on:input={resetError} />
                <Input bind:value={password} type="password" name="password" placeholder="password" required on:input={resetError} />
                <div class="flex items-start">
                    <Checkbox class="text-white-500 dark:text-white-500">Remember me</Checkbox>
                    <a href="/" class="ml-auto text-sm text-white-500 hover:underline dark:text-white-500">Forgot password?</a>
                </div>
                <Button type="submit" class="w-full1">Sign in</Button>
                 <p class="text-sm font-light text-white-500 dark:text-white-500">Dont have an account yet? 
                 <a href="/" class="font-medium text-white-500 hover:underline dark:text-white-500">Sign up</a>
                </p>
            </form>
            {#if $showError}
            <div class="toast-warning-container">
                <ToastWarning on:resetError={resetError} />
            </div>
            {/if}
        </div>
    </div>
</div>