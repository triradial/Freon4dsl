<script lang="ts">
    import LoginPart from '../components/common/LoginPart.svelte';
</script>

<style>
    .login-page {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: black;
        background-image: url("/assets/images/login.svg");
        background-position: top left;
        background-repeat: no-repeat;
        background-size: 50rem;
    }

    .login-container {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 24rem;
        transform: translate(-50%, -50%);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    :global(body) {
        overflow: hidden;
    }
</style>

<div class="login-page">
    <div class="login-container">
        <LoginPart />
    </div>
</div>