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
            top: 75%;
            right: 0;
            width: 150px;
            background-color: var(--background-1);
            border-radius: 3px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            margin-top: 10px;
            gap: 10px;
            opacity: 0;
            pointer-events: none;
            box-shadow: var(--shadow-2);

            a {
                text-decoration: none;
            }

            &:global(.visible) {
                opacity: 1;
                pointer-events: all;
                top: 100%;
            }

            @media screen and (width <= 640px) {
                margin-top: 20px;
                top: calc(-200% - 20px);
            }
        }
    }
</style>