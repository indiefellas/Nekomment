<script>
    import Icon from "@iconify/svelte";
    const { host, comments, inReview, paths } = $props();
</script>

<a class="button" href={"/dash/" + host}>
    <h2>{host}</h2>
    <div class="host-stats">
        <p>
            <Icon icon="material-symbols:comment" inline />
            {comments}
        </p>
        <p>
            <Icon icon="garden:moderation-26" inline />
            {inReview}
        </p>
        <p>
            <Icon icon="material-symbols:page-footer" inline />
            {paths}
        </p>
    </div>
</a>

<style scoped>
    .host-stats {
        display: flex;
        gap: 10px;
    }
</style>
