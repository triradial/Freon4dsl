<script>
    let isOpen = true;
    let navItems = ['Item 1', 'Item 2', 'Item 3'];
</script>

<aside class={isOpen ? 'open' : 'closed'}>
    <ul>
        {#each navItems as item}
            <li>{item}</li>
        {/each}
    </ul>
</aside>