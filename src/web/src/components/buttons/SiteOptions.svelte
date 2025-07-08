<script lang="ts">
    import Icon from "@iconify/svelte";

    let optionsDiv: HTMLDivElement;
    function loadUserSettings() {
        optionsDiv.classList.toggle('visible');
    }
</script>

<div class="site-options">
    <button aria-label="Site options" onclick={loadUserSettings}>
        <Icon icon="lucide:cog" inline />
    </button>
    
    <div class="options" bind:this={optionsDiv}>
        <a href="/settings">
            User Settings
        </a>
        <a href="/logout">
            Logout
        </a>
    </div>    
</div>

<style scoped>
    .site-options {
        position: relative;

        .options {
            position: absolute;
            right: 0;
            width: 150px;
            background-color: var(--background-2);
            border-radius: 3px;
            padding: 10px;
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            opacity: 0;
            pointer-events: none;

            a {
                text-decoration: none;
            }

            &:global(.visible) {
                opacity: 1;
                pointer-events: all;
            }
        }
    }
</style>