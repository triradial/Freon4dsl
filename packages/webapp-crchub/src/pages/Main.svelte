
<script lang="ts">
    import { onMount, createEventDispatcher, SvelteComponent } from 'svelte';

    import NavBar from '../components/common/NavBar.svelte';
    import SideNav from '../components/common/SideNav.svelte';
    import Breadcrumb from '../components/common/Breadcrumb.svelte';

    import Home from '../content/Home.svelte';
    import Studies from '../content/Studies.svelte';
    import Patients from '../content/Patients.svelte';

    export let contentName: string = "Home";
    let contentComponent: typeof SvelteComponent;
    let breadcrumbItems: { label: string; href?: string }[] = [];
  
    const dispatch = createEventDispatcher();

    onMount(async () => {
      setContent("Home");
    });
  
    function loadContent(event: Event) {
      if (event instanceof CustomEvent) {
        let { contentName } = event.detail;
        setContent(contentName);
      } else {
        console.error('Unexpected event type');
      }
    }

    function setContent(name: string) {
      switch(name) {
        case 'Home':
          contentComponent = Home as typeof SvelteComponent;
          breadcrumbItems = [];
          break;
        case 'Studies':
          contentComponent = Studies as typeof SvelteComponent;
          breadcrumbItems = [
            { label: 'Studies' },
          ];
          break;
        case 'Patients':
          contentComponent = Patients as typeof SvelteComponent;
          breadcrumbItems = [
            { label: 'Patients' },
          ];
          break;
        default:
          contentComponent = Home as typeof SvelteComponent;
      }
      dispatch('componentChange', contentName);
    }
  </script>
  
  <div id="app-container">
    <appbar>
      <NavBar on:loadContent={loadContent} />
    </appbar>
    <div id="content-container">
      <appnav id="appnav-component">
        <SideNav on:loadContent={loadContent} />
      </appnav>
      <main>
        <Breadcrumb items={breadcrumbItems} />
        {#await contentComponent}
          <p>Loading...</p>
        {:then Component}
          <svelte:component this={Component} />
        {:catch error}
          <p>Error loading content: {error.message}</p>
        {/await}
      </main>
    </div>
  </div>
  