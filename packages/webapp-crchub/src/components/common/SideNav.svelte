<script lang="ts">
    import { Sidebar, SidebarBrand, SidebarCta, SidebarDropdownItem, SidebarDropdownWrapper, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faHome, faMicroscope, faHospitalUser } from '@fortawesome/free-solid-svg-icons';
    import { navigateTo } from '../../services/routeAction';
    import { ROUTE } from '../../constants/routeConstants';   
    import { LABEL } from '../../constants/labelConstants';

    let activeClass = 'flex items-center p-2 text-base font-normal hover:bg-primary-100';
    let nonActiveClass = 'flex items-center p-2 text-base font-normal hover:bg-primary-900';
    let asideClass = 'w-40 h-screen';
    let spanClass = 'flex-1 ms-2 whitespace-nowrap rounded-none';
    let style = false;
    
    function loadContent(event: Event, routeName: string) {
      console.log('sidenav->component:', routeName);
      event.preventDefault();
      navigateTo(routeName);
    }
</script>

<Sidebar {asideClass} {activeClass} {nonActiveClass} >
    <SidebarWrapper divClass="overflow-y-auto rounded-none">
      <SidebarGroup>
        <SidebarItem label={LABEL.HOME} {spanClass} on:click={(event) => loadContent(event, ROUTE.HOME)}>
            <svelte:fragment slot="icon">
                <FontAwesomeIcon icon={faHome} class="w-4 h-4" />
            </svelte:fragment>
        </SidebarItem>
        <SidebarItem label={LABEL.STUDIES} {spanClass} on:click={(event) => loadContent(event, ROUTE.STUDIES)}>
          <svelte:fragment slot="icon">
            <FontAwesomeIcon icon={faMicroscope} class="w-4 h-4" />
          </svelte:fragment>
        </SidebarItem>
          <SidebarItem label={LABEL.PATIENTS} {spanClass} on:click={(event) => loadContent(event, ROUTE.PATIENTS)}>
            <svelte:fragment slot="icon">
                <FontAwesomeIcon icon={faHospitalUser} class="w-4 h-4" />
            </svelte:fragment>
          </SidebarItem>
      </SidebarGroup>
    </SidebarWrapper>
  </Sidebar>