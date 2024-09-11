<script>
    import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
    //import { patients, loadPatients } from '../services/datastore.js';

    export let items = [];

    let breadcrumbItems = [];

    $: {
        breadcrumbItems = [];
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let href = i < items.length - 1 ? '/' + item.item : undefined;
            let text = item.item.charAt(0).toUpperCase() + item.item.slice(1);
            if (item.id) {
                let name ="Entity Name";
                //let entity = await getEntityById(item.id);
                text = `${text}: ${name}`;
            }
            breadcrumbItems.push({ href, text });
        }
    }
</script>

<Breadcrumb navClass="crc-breadcrumb" aria-label="Default breadcrumb example">
    <BreadcrumbItem href="/" home>Home</BreadcrumbItem>
    {#each breadcrumbItems as { href, text } (href)}
        <BreadcrumbItem {href}>{text}</BreadcrumbItem>
    {/each}
</Breadcrumb>