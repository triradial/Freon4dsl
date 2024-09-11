<script>
  import { get, writable } from 'svelte/store';
  import { patients } from '$lib/datastore.js';

  let id = '';
  let name = '';
  let dob = '';
  let study = '';

  const submitForm = async () => {
      const newPatient = { id, name, dob, study };
      patients.update(currentPatients => [...currentPatients, newPatient]);
  };
</script>
  
  <form on:submit|preventDefault={submitForm}>
    <input placeholder="Name" bind:value={name} />
    <input type="date" bind:value={dob} />
    <input placeholder="Study" bind:value={study} />
    <button type="submit">Add Patient</button>
  </form>
  
  <style>
    /* Your CSS styles here */
  </style>
  