<script lang="ts">
  import Tooltip from "../ui/Tooltip.svelte";

    const buttonCode = `<a href="https://beta.cmt.nkko.link/"><img src="https://beta.cmt.nkko.link/res/88x31.png" alt="Powered by Nekomment"></a>`;

    let copied = false;
    let copiedTimeout = 0;

    let tooltip: Tooltip;

    function copyCode() {
        navigator.clipboard.writeText(buttonCode);

        copied = true;
        tooltip.calculatePositions();

        clearTimeout(copiedTimeout);
        copiedTimeout = setTimeout(() => {
            copied = false;
            tooltip.calculatePositions();
        }, 2000) as unknown as number;
    }

</script>

<Tooltip bind:this={tooltip}>
    <button slot="content" on:click={() => copyCode()}>
        <img src="/res/88x31.png" alt="Powered by Nekomment">
    </button>
    <span slot="tooltip">
        {copied ? "Button code copied!" : "Click to copy button code"}
    </span>
</Tooltip>