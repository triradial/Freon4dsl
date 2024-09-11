<script>
    export let onSearch; // Function to call when searching
    let searchTerm = '';
  
    const handleSearch = () => {
      onSearch(searchTerm);
    };
  </script>
  
  <div>
    <input type="text" bind:value={searchTerm} on:change={handleSearch} />
    <button on:click={handleSearch}>Search</button>
  </div>

  