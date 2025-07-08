<script>
    import Icon from "@iconify/svelte";
    import { onMount } from "svelte";

    let isLight = false;

    function onThemeToggle() {
        const body = document.body;
        if (body.classList.contains('light')) {
            body.classList.remove('light');
            localStorage.setItem('nkm:theme', 'dark user');
            isLight = false;
        } else {
            body.classList.add('light');
            localStorage.setItem('nkm:theme', 'light user');
            isLight = true;
        }
    }
    onMount(() => {
        const body = document.body;
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)');
        if (localStorage.getItem('nkm:theme').includes('light') || (prefersLight.matches && !localStorage.getItem('nkm:theme').includes('user'))) {
            body.classList.add('light');
            localStorage.setItem('nkm:theme', 'light');
            isLight = true;
        }
        prefersLight.addEventListener('change', (ev) => {
            if (ev.matches && !localStorage.getItem('nkm:theme').includes('user')) {
                body.classList.add('light');
                localStorage.setItem('nkm:theme', 'light');
                isLight = true;
            } else {
                body.classList.remove('light');
                localStorage.setItem('nkm:theme', 'dark');
                isLight = false;
            }
        })
    })
</script>

<button aria-label="Enable Light Mode" onclick={onThemeToggle}>
    {#if isLight}
        <Icon icon="iconamoon:mode-dark-fill" inline />
    {:else}
        <Icon icon="iconamoon:mode-light-fill" inline />
    {/if}
</button>