document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)');
    if (localStorage.getItem('nkm:theme')?.includes('light') || (prefersLight.matches && !localStorage.getItem('nkm:theme')?.includes('user'))) {
        body.classList.add('light');
        localStorage.setItem('nkm:theme', 'light');
    }
    prefersLight.addEventListener('change', (ev) => {
        if (localStorage.getItem('nkm:theme')?.includes('user')) return;
        if (ev.matches) {
            body.classList.add('light');
            localStorage.setItem('nkm:theme', 'light');
        } else {
            body.classList.remove('light');
            localStorage.setItem('nkm:theme', 'dark');
        }
    })
})