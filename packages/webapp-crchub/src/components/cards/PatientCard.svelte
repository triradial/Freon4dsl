<script lang="ts">
  import { Card, Badge, Button, Input, Select, Helper } from "flowbite-svelte";
  import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
  import { faPencil, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
  import { type Patient } from "../../services/dataStore";
  import { createEventDispatcher } from "svelte";

  export let patient: Patient;
  export let isEditing = false;
  let editedPatient = { ...patient };
  const dispatch = createEventDispatcher();

  $: getInputClass = (field: keyof typeof errors) => {
      return errorState[field] ? 'error' : '';
  }
  $: if (isEditing) {
      validateAllFields();
  }
  let errors = {
      displayName: "",
  };
  $: errorState = { ...errors };
  $: hasErrors = Object.values(errorState).some(error => error !== "");

  function toggleEdit() {
      isEditing = !isEditing;
      if (isEditing) {
          editedPatient = { ...patient };
          validateAllFields();
      }
  }

  function saveChanges() {
      validateAllFields();
      if (Object.values(errorState).every(error => error === "")) {
          dispatch("save", editedPatient);
          isEditing = false;
      }
  }

  function cancelEdit() {
      editedPatient = { ...patient };
      isEditing = false;
      errors = { displayName: ""};
      errorState = { ...errors };
  }

  function handleInput(field: keyof typeof errors) {
      return (event: Event) => {
          const target = event.target as HTMLInputElement;
          validateField(field, target.value);
      };
  }
  
  function validateAllFields() {
      (Object.keys(editedPatient) as Array<keyof typeof errors>).forEach(key => {
          if (key in errors) {
              validateField(key, editedPatient[key]);
          }
      });
  }

  function validateField(field: keyof typeof errors, value: string) {
      if (field === 'displayName' && !value.trim()) {
          errors[field] = 'Patient name is required';
      } else {
          errors[field] = '';
      }
      errorState = { ...errors };
  }
</script>

<Card class="crc-card-area max-w-sm h-full">
  <div class="flex items-center justify-left mb-4">
      <h3 class="text-base font-bold mr-2">Patient</h3>
      {#if !isEditing}
          <Button pill={true} outline={true} class="grid-header-button" size="sm" on:click={toggleEdit}>
              <FontAwesomeIcon icon={faPencil} />
          </Button>
      {/if}
  </div>
  <div class="space-y-2">
      <div>
          <h4 class="card-label-text">Name</h4>
          {#if isEditing}
              <Input type="text" bind:value={editedPatient.displayName} on:input={handleInput('displayName')} class="crc-field {getInputClass('displayName')}" />
              {#if errorState.displayName}
                  <Helper color="red">{errorState.displayName}</Helper>
              {/if}
          {:else}
              <p class="text-sm">{patient.displayName}</p>
          {/if}
      </div>
      <div>
          <h4 class="card-label-text">DOB</h4>
          {#if isEditing}
              <Input type="date" bind:value={editedPatient.dob} class="crc-field" />
          {:else}
              <p class="text-xs">{patient.dob}</p>
          {/if}
      </div>
      <div>
          <h4 class="card-label-text">Gender</h4>
          {#if isEditing}
              <Select bind:value={editedPatient.gender} class="crc-field">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
              </Select>
          {:else}
              <p class="text-sm">{patient.gender}</p>
          {/if}
      </div>
  </div>
  {#if isEditing}
      <div class="flex items-center justify-center mt-4">
          <Button size="xs" color="primary" class="mr-2" on:click={saveChanges} disabled={hasErrors}>
              <FontAwesomeIcon icon={faSave} class="mr-2" />
              Save
          </Button>
          <Button size="xs" color="light" on:click={cancelEdit}>
              <FontAwesomeIcon icon={faTimes} class="mr-2" />
              Cancel
          </Button>
      </div>
  {/if}
</Card>

<style>
  :global(.card) {
      border-radius: 0;
      box-shadow: none;
      border: 1px solid #e5e7eb;
  }
</style>