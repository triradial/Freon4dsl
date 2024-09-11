<script>
    import { Sidebar, SidebarBrand, SidebarCta, SidebarDropdownItem, SidebarDropdownWrapper, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
    import { createEventDispatcher } from 'svelte';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faHome, faMicroscope, faHospitalUser } from '@fortawesome/free-solid-svg-icons';

    const dispatch = createEventDispatcher();

    function loadContent(event, componentName, breadcrumbItem) {
      console.log('sidenav->component:', componentName);
      event.preventDefault();
      dispatch('loadContent', { componentName, breadcrumbItem });
    }
    let activeClass =    'flex items-center p-2 text-base font-normal hover:bg-primary-100';
    let nonActiveClass = 'flex items-center p-2 text-base font-normal hover:bg-primary-900';
    let asideClass = 'w-40 h-full';
    let spanClass = 'flex-1 ms-2 whitespace-nowrap rounded-none';
    let style = false;
</script>

<Sidebar {asideClass} {activeClass} {nonActiveClass} >
    <SidebarWrapper divClass="overflow-y-auto rounded-none">
      <SidebarGroup>
        <SidebarItem label="Home" {spanClass} on:click={(event) => loadContent(event, 'Home', { item: 'home' })}>
            <svelte:fragment slot="icon">
                <FontAwesomeIcon icon={faHome} class="w-4 h-4" />
            </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Studies" {spanClass} on:click={(event) => loadContent(event, 'Studies', { item: 'studies' })}>
          <svelte:fragment slot="icon">
            <FontAwesomeIcon icon={faMicroscope} class="w-4 h-4" />
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Patients" {spanClass} on:click={(event) => loadContent(event, 'Patients', { item: 'patients' })}>
            <svelte:fragment slot="icon">
                <FontAwesomeIcon icon={faHospitalUser} class="w-4 h-4" />
            </svelte:fragment>
          </SidebarItem>
      </SidebarGroup>
    </SidebarWrapper>
  </Sidebar>