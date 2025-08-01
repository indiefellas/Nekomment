<script lang="ts">
    const { comments }: { comments: {
        id: string;
        host: string;
        address: string;
        pagePath: string;
        author: string;
        content: string;
        website: string | null;
        createdAt: Date | null;
        parentId: string | null;
        approved: boolean | null;
        moderatedBy: string | null;
        replies: {
            id: string;
            host: string;
            address: string;
            pagePath: string;
            author: string;
            content: string;
            website: string | null;
            createdAt: Date | null;
            parentId: string | null;
            approved: boolean | null;
            moderatedBy: string | null;
        }[];
    }[] } = $props();
</script>

{#each comments as comment}
<div class="card comment">
    <div class="heading">
        <div>
            {#if !comment.approved}
                <div class="in-review">
                    In review: {comment.moderatedBy}
                </div>
            {/if}
        </div>
        <p>
            <span>[comment.address]</span> -
            <span>{comment.createdAt?.toLocaleDateString()}</span>
        </p>
    </div>
    <h2>{comment.author}</h2>
    <p>{comment.content}</p>
    <div class="actions">
        {#if !comment.approved}
            <button>Approve</button>
        {:else}
            <button>Reply</button>
        {/if}
        <button class="warning">Delete</button>
        <button class="warning">Block user</button>
    </div>
    {#if comment.replies.length > 0}
        <div class="replies">
            {#each comment.replies as reply}
                <blockquote>
                    <div class="heading">
                        <div>
                            {#if !reply.approved}
                                <div class="in-review">
                                    In review:{" "}
                                    {reply.moderatedBy}
                                </div>
                            {/if}
                        </div>
                        <p>
                            <span>{reply.address}</span> -
                            <span>
                                {reply.createdAt?.toLocaleDateString()}
                            </span>
                        </p>
                    </div>
                    <h2>{reply.author}</h2>
                    <p>{reply.content}</p>
                    <div class="actions">
                        {#if !reply.approved}
                            <button>Approve</button>
                        {/if}
                        <button class="warning">
                            Delete
                        </button>
                        <button class="warning">
                            Block user
                        </button>
                    </div>
                    
                </blockquote>
            {/each}
        </div>
    {/if}
</div>
{/each}