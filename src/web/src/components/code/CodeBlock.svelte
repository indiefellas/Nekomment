<script lang="ts">
    import { Highlight } from "svelte-highlight";
    import Tooltip from "../ui/Tooltip.svelte";
    import Icon from "@iconify/svelte";
  import { TooltipPlacement } from "../ui/TooltipPlacement";

    export let language;
    export let code: string;

    let copied = false;
    let copiedTimeout = 0;
    let tooltip: Tooltip;
    function copyCode() {
        navigator.clipboard.writeText(code);

        copied = true;
        tooltip.calculatePositions();

        clearTimeout(copiedTimeout);
        copiedTimeout = setTimeout(() => {
            copied = false;
            tooltip.calculatePositions();
        }, 2000) as unknown as number;
    }

</script>

<div class="code-block">
    <div class="copy-btn-holder">
        <Tooltip placement={TooltipPlacement.Left} bind:this={tooltip}>
            <button class:copied type="button" slot="content" on:click={() => copyCode()}>
                <Icon icon="mdi:clipboard-outline" />
                <span class="copy-check">
                    <Icon icon="mdi:check" />
                </span>
            </button>
            <span slot="tooltip">
                {copied ? "Copied!" : "Click to copy"}
            </span>
        </Tooltip>
    </div>
    <Highlight {language} {code} />
</div>

<style>
    .code-block {
        display: flex;
        align-items: center;
        background: var(--background-0);
        border-radius: 5px;
        position: relative;
        min-height: calc(1.2ch + 1em + 10px);

        :global(pre) {
            font-size: 1.2em;
            padding: 0.5em calc(2.4ch + 1em + 10px) 0.5em 1.2ch;
            overflow-x: auto;
        }

        .copy-btn-holder {
            position: absolute;
            right: 5px;
            top: 5px;

            button {
                position: relative;
                display: flex;
                padding: 0.6ch;
                overflow: hidden;
            }

            .copy-check {
                display: block;
                position: absolute;
                inset: 0;
                display: flex;
                padding: 0.6ch;
                font-size: inherit;
                background: var(--background-green);
                opacity: 0;
                border-radius: 5px;
            }
            button.copied .copy-check {
                opacity: 1;
            }
        }
    }
</style>