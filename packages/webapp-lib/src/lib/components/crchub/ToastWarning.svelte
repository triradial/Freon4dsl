<script>
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
    import { Toast } from "flowbite-svelte";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    const handleResetError = () => {
        dispatch('resetError');
    };

</script>

<Toast on:close={handleResetError}>
    <FontAwesomeIcon icon={faCircleExclamation} class="w-5 h-5" />
    Incorrect username or password. Please try again.
</Toast>