<script lang="ts">
    import { Highlight } from "svelte-highlight";

    export let language;
    export let code;
</script>

<div class="code-block">
    <Highlight {language} {code} />
</div>

<style>
    .code-block {
        background: var(--background-0);
        font-size: 1.2em;
        border-radius: 5px;

        :global(pre) {
            padding: 0.5em 1.2ch;
            overflow-x: auto;
        }
    }
</style>