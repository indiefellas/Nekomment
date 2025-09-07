<script>
    import { onMount } from "svelte";

    const average = array => array.reduce((a, b) => a + b) / array.length;

    //@ts-ignore
    window.fps = 0;

    let fps = 0;
    let times = [];
    let highest = 0, lowest = 0, avg = 0;
    let prevFps = [];

    window.requestAnimationFrame(fpsMeasureLoop);
    function fpsMeasureLoop() {
        const now = performance.now();
        while (times.length > 0 && times[0] <= now - 1000) {
            times.shift();
        }
        times.push(now);
        fps = times.length;
        prevFps.push(fps);
        avg = average(prevFps).toFixed(2);
        if (fps > highest) highest = fps;
        if (fps < avg) lowest = fps;
        //@ts-ignore
        window.fps = prevFps;
        window.requestAnimationFrame(fpsMeasureLoop);
    }

    document.addEventListener("astro:before-swap", () => {
        fps = 0;
        times = [];
        highest = 0;
        lowest = 0;
        avg = 0;
        prevFps = [];
    })
</script>

{#if window.location.search.includes('fpsdebug')}
<div class="fps-meter">
    <h2>fps {fps}</h2>
    <p>avg {avg}</p>
    <p>highest {highest}</p>
    <p>lowest {lowest}</p>
</div>

<style scoped>
    .fps-meter {
        position: fixed;
        top: 20px;
        left: 20px;
        background-color: var(--background-1);
        z-index: 20000;
        opacity: 0.50;
        padding: 10px;
        border-radius: 5px;
        pointer-events: none;

        * {
            font-weight: normal;
        }
    }
</style>
{/if}