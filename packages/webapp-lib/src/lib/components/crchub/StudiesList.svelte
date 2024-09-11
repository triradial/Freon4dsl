<script>
  import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch } from 'flowbite-svelte';
  import { studies, loadStudies } from '$lib/datastore.js';
  import { onMount } from 'svelte';

  onMount(loadStudies);

  let searchTerm = '';
  $: filteredItems = $studies.filter((study) => 
      study.title.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
    );  
</script>

<TableSearch color="default" customColor="bg-primary-700" striped={true} noborder={true} hoverable={true} placeholder="Search" bind:inputValue={searchTerm}>
  <TableHead>
    <TableHeadCell>Study</TableHeadCell>
    <TableHeadCell>Title</TableHeadCell>
    <TableHeadCell>Phase</TableHeadCell>
    <TableHeadCell><span class="sr-only">Edit</span></TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each filteredItems as study (study.name)}
      <TableBodyRow>
        <TableBodyCell>{study.name}</TableBodyCell>
        <TableBodyCell>{study.title}</TableBodyCell>
        <TableBodyCell>{study.phase}</TableBodyCell>
        <TableBodyCell><button>Edit</button></TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</TableSearch>
  