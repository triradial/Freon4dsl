<script lang="ts">
    import { Router, Route, navigate } from 'svelte-routing';
    // import { isAuthenticated } from './services/auth.js';
    import Main from './pages/Main.svelte';
    import Login from './pages/Login.svelte';
    import { onMount } from 'svelte';
  
    let auth = false;
    const validPages = ['/', '/patients', '/studies'];
    import { isAuthenticated, redirectUrl } from './services/auth';

    onMount(() => {
        const storedAuth = sessionStorage.getItem('auth');
        if (storedAuth) {
            auth = storedAuth === 'true';
        }

        isAuthenticated.subscribe(value => {
            auth = value;
            console.log('auth:', auth);
            sessionStorage.setItem('auth', auth.toString());
            let currentPath = window.location.pathname;
            if (!auth) {
                if (validPages.includes(currentPath) && currentPath !== '/login') {
                    redirectUrl.set(currentPath);
                } else {
                    redirectUrl.set('/');
                }
                navigate('/login');
            } else {
                redirectUrl.subscribe(url => {
                    if (url) {
                        redirectUrl.set('');
                        navigate(url);
                    } else {
                        if (validPages.includes(currentPath) || currentPath === '/login') {
                            navigate(currentPath);
                        } else {
                            navigate('/');
                        }
                    }
                });
            }
        });
    });
    // isAuthenticated.subscribe(value => {
    //     auth = value;
    //     console.log('auth:', auth);
    //     sessionStorage.setItem('auth', auth.toString());
    //     let currentPath = window.location.pathname;
    //     if (!auth) {
    //         if (validPages.includes(currentPath) && currentPath !== '/login') {
    //             sessionStorage.setItem('redirectUrl', currentPath);
    //         } else {
    //             sessionStorage.setItem('redirectUrl', '/');
    //         }
    //         navigate('/login');
    //     } else {
    //         let redirectUrl = sessionStorage.getItem('redirectUrl');
    //         if (redirectUrl) {
    //             sessionStorage.removeItem('redirectUrl');
    //             navigate(redirectUrl);              
    //         } else {
    //             if (validPages.includes(currentPath) || currentPath === '/login') {
    //                 navigate(currentPath);
    //             } else {
    //                 navigate('/');
    //             }
    //         }
    //     }
    // });
    function handleComponentChange(componentName: string) {
        console.log(`Component changed to: ${componentName}`);
        // Add any additional logic you need when the component changes
    }
  </script>
  
  <Router>
    {#if auth}
        <Route path="/" let:params>
            <Main contentName="Home" on:componentChange={(e) => handleComponentChange(e.detail)} />
        </Route>
        <Route path="/patients" let:params>
            <Main contentName="Patients" on:componentChange={(e) => handleComponentChange(e.detail)} />
        </Route>
        <Route path="/about" let:params>
            <Main contentName="About" on:componentChange={(e) => handleComponentChange(e.detail)} />
        </Route>
        <Route path="/admin" let:params>
            <Main contentName="Admin" on:componentChange={(e) => handleComponentChange(e.detail)} />
        </Route>
    {:else}
        <Route component={Login} />
    {/if}
  </Router>
  