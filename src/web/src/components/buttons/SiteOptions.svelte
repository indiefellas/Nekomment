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
            top: 100%;
            transform: scale(0.8);
            transform-origin: top right;
            right: 0;
            width: 150px;
            background-color: var(--background-3);
            border-radius: 3px;
            padding: 0.5em 1.2ch;
            display: flex;
            flex-direction: column;
            margin-block: 5px;
            gap: 10px;
            opacity: 0;
            pointer-events: none;
            box-shadow: var(--shadow-2);
            text-align: end;
            a {
                text-decoration: none;
            }

            &:global(.visible) {
                opacity: 1;
                pointer-events: all;
                transform: none;
            }
        }
    }

    @media screen and (width <= 640px) {
        .site-options .options {
            top: auto;
            bottom: 100%;
            transform-origin: bottom right;
        }
    }
</style>