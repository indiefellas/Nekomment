<script>
    import Icon from "@iconify/svelte";
    const { host, comments, inReview } = $props();
</script>

<a class="button" href={"/host/" + host}>
    <h3>{host}</h3>
    <div class="host-stats">
        <p aria-description="total comments">
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
    h3 {
        font-size: 1.5em;
    }
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
    @media screen and (width <= 640px) {
        h3 {
            font-size: 1.3em;
        }
    }
</style>
