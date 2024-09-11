<script>
    import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Avatar, Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from 'flowbite-svelte';
    import { Alert } from 'flowbite-svelte';
    import { isAuthenticated } from '../services/auth.js';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function loadContent(event, componentName, breadcrumbItem) {
      console.log('navbar->component:', componentName);
      event.preventDefault();
      dispatch('loadContent', { componentName, breadcrumbItem });
    }

    function signOut() {
        isAuthenticated.set(false);
        sessionStorage.setItem('auth', 'false');
    }
    let user = { name: 'Graham McGibbon' };

</script>

<Navbar class="navbar-component">
  <NavBrand href="/">
      <img src="/assets/images/logo_color.svg" class="me-1 h-8 sm:h-9" alt="CRCHub Logo" />
      <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
        <span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span>
      </span>
  </NavBrand>
  <!-- <NavUl class="navbar-commands">
    <NavLi href="/" active={true} on:click={(event) => loadContent(event, 'Home', { item: 'home' })}>Home</NavLi>
    <NavLi href="/studies" on:click={(event) => loadContent(event, 'Studies', { item: 'studies' })}>Studies</NavLi>
    <NavLi href="/patients" on:click={(event) => loadContent(event, 'Patients', { item: 'patients' })}>Patients</NavLi>
  </NavUl> -->
  <div class="grow" />
  <div class="flex items-center md:order-2"> <!-- Modified line -->
    <Avatar id="avatar-menu" border>GM</Avatar>
    <NavHamburger class1="w-full md:flex md:w-auto md:order-1" />
  </div>
  <Dropdown placement="bottom" triggeredBy="#avatar-menu">
    <DropdownHeader>
      <span class="block text-sm">Graham McGibbon</span>
      <span class="block truncate text-sm font-medium">graham.mcgibbon@triradial.com</span>
    </DropdownHeader>
    <DropdownItem>Profile</DropdownItem>
    <DropdownItem>Settings</DropdownItem>
    <DropdownDivider />
    <DropdownItem on:click={signOut}>Sign out</DropdownItem>
  </Dropdown>
</Navbar>
 
