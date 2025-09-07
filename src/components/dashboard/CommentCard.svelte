<script lang="ts">
    import FormModal from "../ui/FormModal.svelte";

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

    let deleteComment = $state(false);
    let commentToDelete: any = $state();

    function delCmt(data: any) {
        console.log(data);
        commentToDelete = data;
        deleteComment = true;
    }

    function preventDefault(fn: Function) {
		return function (event) {
			event.preventDefault();
			fn.call(this, event);
		};
	}
</script>

{#if deleteComment}
    <FormModal title="Do you want to delete this comment?" event="delete-comment-clicked" id="delete-comment-modal" bind:visible={deleteComment}>
        <p>
            You are going to delete this comment:
        </p>
        {#if commentToDelete.parentId}
            <blockquote class="card comment">
                <h2>{commentToDelete.author}</h2>
                <p>{commentToDelete.content}</p>
            </blockquote>
        {:else}
            <div class="card comment">
                <h2>{commentToDelete.author}</h2>
                <p>{commentToDelete.content}</p>
            </div>
        {/if}
        <p>
            Are you sure? This cannot be undone!
        </p>
        <div slot="buttons">
            <input type="hidden" name="id" value={commentToDelete.id} />
            <input type="hidden" name="type" value="delete" />
            <button id="cancel" onclick={preventDefault(() => deleteComment = false)}>Cancel</button>
            <button class="warning">Delete</button>
        </div>   
    </FormModal>

    <style scoped>
        #delete-comment-modal .card.comment {
            margin-block: 10px;
            width: 700px;
            max-width: 100%;
        }
    </style>
{/if}

{#each comments as comment}
<div class="card comment nkm-comment" data-nkm-id={comment.id}>
    <div class="heading">
        <div>
            {#if !comment.approved}
                <div class="in-review">
                    In review: {comment.moderatedBy}
                </div>
            {/if}
        </div>
        <p>
            <span>{comment.pagePath}</span> -
            <span>{comment.address}</span> -
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
        <button class="warning nkm-delete" onclick={() => delCmt(comment)}>Delete</button>
        <button class="warning">Block user</button>
    </div>
    {#if comment.replies.length > 0}
        <div class="replies">
            {#each comment.replies as reply}
                <blockquote class="nkm-comment" data-nkm-id={reply.id} data-nkm-parent-id={comment.id}>
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
                        <button class="warning nkm-delete" onclick={() => delCmt(reply)}>
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