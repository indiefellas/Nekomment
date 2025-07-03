<script lang="ts">
    export let noText: boolean = false;
</script>

<span class="signature">
    <img src="/favicon.svg" alt="Nekomment logo" aria-hidden="true" /> 
    {noText ? "" : "Nekomment"}
</span>

<style scoped>
    .signature {
        white-space: nowrap;
        font-size: 1em;
        font-weight: 700;
        color: var(--color-0);
        text-decoration: none;

        img {
            width: 1em;
            height: 1em;
            vertical-align: -0.15em;
        }
    }
</style>