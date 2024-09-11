<script>
    export let patient;
  </script>
  
  <tr>
    <td>{patient.id}</td>
    <td>{patient.name}</td>
    <td>{patient.dob}</td>
    <td>{patient.study}</td>
    <td>
      <!-- Actions like edit could go here -->
      <button>Edit</button>
    </td>
  </tr>
  
  <style>
    /* Your CSS styles here */
  </style>
  