<script lang="ts">
    import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Avatar, Dropdown, DropdownItem, DropdownHeader, DropdownDivider, Button } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
    import { Alert } from "flowbite-svelte";
    import { isAuthenticated } from "../../services/auth.js";
    import { navigateTo } from "../../services/routeAction";
    import { theme } from '../../services/themeStore';
    import { ROUTE } from "../../constants/routeConstants";
    import { LABEL } from "../../constants/labelConstants";


    let user = { name: "Mike Vogel" };
    let nonActiveClass = "md:hover:bg-transparent border-none";

    function loadContent(event: Event, routeName: string) {
        console.log("sidenav->component:", routeName);
        event.preventDefault();
        navigateTo(routeName);
    }

    function signOut() {
        isAuthenticated.set(false);
        sessionStorage.setItem("auth", "false");
    }

    let isDark = true;

    function themeToggle() {
        theme.update(currentTheme => currentTheme === 'dark' ? 'light' : 'dark');
    }

    $: isDark = $theme === 'dark';
    $: icon = isDark ? faSun : faMoon;

</script>

<Navbar class="navbar-component">
    <NavBrand href="/">
        <img src="/assets/images/logo_grey.svg" class="me-1 h-6 sm:h-8" alt="CRCHub Logo" />
        <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
            <span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span>
        </span>
    </NavBrand>
    <NavUl
        ulClass="!bg-transparent flex flex-row items-center space-x-4"
        divClass="md:block md:w-auto shocking !w-auto"
        class="navbar-commands border-none"
        hidden={false}
    >
        <NavLi href="#" on:click={(event) => loadContent(event, ROUTE.HOME)}>{LABEL.HOME}</NavLi>
        <NavLi href="#" on:click={(event) => loadContent(event, ROUTE.STUDIES)}>{LABEL.STUDIES}</NavLi>
        <NavLi href="#" on:click={(event) => loadContent(event, ROUTE.AVAILABILITY)}>{LABEL.AVAILABILITY}</NavLi>
    </NavUl>
    <div class="grow" />
    <div class="flex items-center gap-2 mr-2">
        <Button pill={true} outline={true} class="!p-2 w-2 !px-4" size="md" on:click={themeToggle}>
            {#key icon}
                <FontAwesomeIcon icon={icon} />
            {/key}
        </Button>
    </div>
    <div class="flex items-center md:order-2">
        <Avatar id="avatar-menu" border size="sm" class="cursor-pointer">MV</Avatar>
    </div>
    <Dropdown placement="bottom" triggeredBy="#avatar-menu">
        <DropdownHeader>
            <span class="block text-sm">Mike Vogel</span>
            <span class="block truncate text-sm font-medium">mike.vogel@triradial.com</span>
        </DropdownHeader>
        <DropdownItem>Profile</DropdownItem>
        <DropdownItem>Settings</DropdownItem>
        <DropdownDivider />
        <DropdownItem on:click={signOut}>Sign out</DropdownItem>
    </Dropdown>
</Navbar>
