<script>
    import Icon from "@iconify/svelte";
    const { host, comments, inReview } = $props();
</script>

<a class="button" href={"/" + host}>
    <h2>{host}</h2>
    <div class="host-stats">
        <p>
            <Icon icon="material-symbols:comment" inline />
            {comments}
        </p>
        {#if inReview > 0}
            <p class="in-review">
                <Icon icon="garden:moderation-26" inline />
                {inReview} in review
            </p>
        {/if}
    </div>
</a>

<style scoped>
    .host-stats {
        display: flex;
        justify-content: end;
        gap: 10px;

        .in-review {
            background: var(--color-red);
            color: var(--background-red);
            padding-inline: 0.4ch;
            border-radius: 5px;
        }
    }
</style>
