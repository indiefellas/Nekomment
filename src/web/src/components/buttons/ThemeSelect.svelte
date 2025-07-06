<script>
    import Icon from "@iconify/svelte";
    import { onMount } from "svelte";

    function onThemeToggle() {
        const body = document.body;
        if (body.classList.contains('light')) {
            body.classList.remove('light');
            localStorage.setItem('nkm:theme', 'dark');
        } else {
            body.classList.add('light');
            localStorage.setItem('nkm:theme', 'light');
        }
    }

    onMount(() => {
        const body = document.body;
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)');
        if (localStorage.getItem('nkm:theme') === 'light' || prefersLight.matches) {
            body.classList.add('light');
            localStorage.setItem('nkm:theme', 'light');
        }
        prefersLight.addEventListener('change', (ev) => {
            if (ev.matches) {
                body.classList.add('light');
                localStorage.setItem('nkm:theme', 'light');
            } else {
                body.classList.remove('light');
                localStorage.setItem('nkm:theme', 'dark');
            }
        })
    })
</script>

<button aria-label="Enable Light Mode" onclick={onThemeToggle}>
    <Icon icon="si:clear-day-fill" inline />
</button>