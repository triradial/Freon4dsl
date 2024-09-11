<script>
  import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch } from 'flowbite-svelte';
  import { patients, loadPatients } from '../services/datastore.js';
  import { onMount } from 'svelte';

  onMount(loadPatients);

  let searchTerm = '';
  $: filteredItems = $patients.filter((patient) => 
      patient.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
      patient.study.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
      patient.id.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
      patient.dob.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
    );  
</script>

<TableSearch color="default" customColor="bg-primary-700" striped={true} noborder={true} hoverable={true} placeholder="Search" bind:inputValue={searchTerm}>
  <TableHead>
    <TableHeadCell>Patient ID</TableHeadCell>
    <TableHeadCell>Name</TableHeadCell>
    <TableHeadCell>DOB</TableHeadCell>
    <TableHeadCell>Study</TableHeadCell>
    <TableHeadCell><span class="sr-only">Edit</span></TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each filteredItems as patient (patient.id)}
      <TableBodyRow>
        <TableBodyCell>{patient.id}</TableBodyCell>
        <TableBodyCell>{patient.name}</TableBodyCell>
        <TableBodyCell>{patient.dob}</TableBodyCell>
        <TableBodyCell>{patient.study}</TableBodyCell>
        <TableBodyCell><button>Edit</button></TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</TableSearch>
  