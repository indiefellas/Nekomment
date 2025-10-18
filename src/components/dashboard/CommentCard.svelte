<script lang="ts">
    import { onMount } from "svelte";
    import OverType from "overtype";
    import FormModal from "../ui/FormModal.svelte";
    import Checkbox from "../ui/Checkbox.svelte";
    import { parseMarkdown } from "../../lib/markdownRenderer";
    import InfiniteLoading from "svelte-infinite-loading";
    import lodash from "lodash";
    const { chunk } = lodash;

    const {
        comments,
        username,
    }: {
        comments: {
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
        }[];
        username: string;
    } = $props();

    const colors = {
        toolbarBg: "var(--background-3)",
        toolbarIcon: "var(--color-1)",
        toolbarHover: "var(--background-1)",
        bgPrimary: "var(--background-3)",
        bgSecondary: "var(--background-2)",
    };

    let formAction: "delete" | "reply" | "ip-ban" | false = $state(false);
    let selectedComment: any[] = $state();
    let openForm = $state(false);
    let cancelForm = $state(false);
    let cancelitFr = $state(false);
    let submitting = $state(false);
    let replyContent = "";

    let editor: HTMLDivElement | undefined = $state();

    let otEditor: any;

    onMount(() => {
        window.addEventListener("beforeunload", (ev) => {
            if (
                openForm &&
                formAction === "reply" &&
                replyContent.length > 0 &&
                !submitting
            ) {
                ev.preventDefault();
            }
        });
    });

    $effect.pre(() => {
        if (!formAction) {
            if (otEditor && replyContent.length > 0 && !cancelitFr) {
                formAction = "reply";
                cancelForm = true;
                console.log(replyContent);
            }

            if (cancelitFr) {
                replyContent = "";
                cancelitFr = false;
            }
        }
    });

    $effect.pre(() => {
        if (!openForm) {
            if (otEditor && replyContent.length > 0) openForm = true;
            formAction = false;

            $inspect(formAction, selectedComment, openForm).with(console.trace);
        }
    });

    $effect(() => {
        if (editor && selectedComment) {
            [otEditor] = new OverType(editor, {
                placeholder: `Reply to ${selectedComment.author}...`,
                value: replyContent,
                toolbar: true,
                theme: {
                    name: "Nekomment Theme",
                    colors: {
                        ...(!document.documentElement.dataset.theme
                            ? OverType.themes.cave.colors
                            : OverType.themes.solar.colors),
                        ...colors,
                    },
                },
                textareaProps: {
                    required: true,
                    maxLength: 1024,
                    name: "content",
                },
                autoResize: true,
                minHeight: "100px",
                maxHeight: "400px",
            });

            editor.addEventListener(
                "input",
                () => (replyContent = otEditor.getValue()),
            );
        }
    });

    onMount(() => {
        document.addEventListener("nkm:bev", (ev)=>{
            // @ts-ignore
            let ids: any[] = ev.detail.ids;
            // @ts-ignore
            let type: "approve" | "delete" | "block" = ev.detail.type;

            let mappedIds = ids.map(m => comments.find(c => c.id === m) ?? comments.find(c => !!c.replies.find(r => r.id === m))?.replies.find(r => r.id === m)).filter(m => !!m);

            switch (type) {
                case "delete": {
                    delCmt(mappedIds);
                    break;
                }
                case "block": {
                    ipbCmt(mappedIds);
                    break;
                }
            }
        })
    })

    function delCmt(data: any) {
        selectedComment = data;
        formAction = "delete";
        openForm = true;
    }

    function rplCmt(data: any) {
        selectedComment = data;
        formAction = "reply";
        openForm = true;
    }

    function ipbCmt(data: any) {
        selectedComment = data;
        formAction = "ip-ban";
        openForm = true;
    }

    function preventDefault(fn: Function) {
        return function (event) {
            event.preventDefault();
            fn.call(this, event);
        };
    }

    const batchComments = chunk(comments, 25);
    let page = 0;
    let commentShown = $state(batchComments[0]);
    commentShown = [];

    // @ts-ignore
    function infiniteHandler({ detail: { loaded, complete } }) {
        const loading = document.querySelector('.loading');
        if (loading) loading.remove();
        try {
            commentShown = [...commentShown, ...batchComments[page]];
            page++;
            loaded();
        } catch {
            complete();
        }
    }
</script>

{#if formAction}
    <FormModal
        title={formAction === "delete"
            ? "Delete comment"
            : formAction === "reply"
              ? "Reply comment"
              : "Block comment author"}
        event="delete-comment-clicked"
        id="delete-comment-modal"
        bind:visible={openForm}
    >
        <p>
            {#if formAction == "delete"}
                You are going to delete th{selectedComment.length > 1 ? 'ese':'is'} comment{selectedComment.length > 1 ? 's':'s'}:
            {:else if formAction == "ip-ban"}
                You are going to block th{selectedComment.length > 1 ? 'ese':'is'} author's IP address{selectedComment.length > 1 ? 'es':''}:
            {/if}
        </p>
        <div class="comments-actioned">
            {#each selectedComment as comment}
                {#if comment.parentId}
                    <blockquote class="card comment">
                        <h2>{comment.author}</h2>
                        <p>{@html comment.content}</p>
                    </blockquote>
                {:else}
                    <div class="card comment">
                        <h2>{comment.author}</h2>
                        <p>{@html comment.content}</p>
                        {#if formAction == "reply"}
                            <blockquote class="nkm-reply-editor">
                                <h2>{username}</h2>
                                <div class="editor" bind:this={editor}></div>
                            </blockquote>
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>
        {#if formAction === "ip-ban"}
            <Checkbox name="delete" value="true"
                >Also delete all comments of the IP address{selectedComment.length > 1 ? 'es':''} {selectedComment.map(c => c.address).join(', ')}
                (<b>this cannot be undone!</b>)</Checkbox
            >
        {/if}
        <div slot="buttons">
            <input type="hidden" name="id" value={selectedComment.map(m => m.id).join(",")} />
            <input type="hidden" name="type" value={formAction} />
            <input type="hidden" name="path" value={selectedComment[0].pagePath} />
            <button
                id="cancel"
                onclick={preventDefault(() => (formAction = false))}
                >Cancel</button
            >
            {#if formAction === "delete" || formAction === "ip-ban"}
                <button class="warning"
                    >{formAction === "delete" ? "Delete" : "IP ban"}</button
                >
            {:else}
                <button
                    class="primary"
                    onclick={() => {
                        submitting = true;
                    }}>Reply</button
                >
            {/if}
        </div>
    </FormModal>

    <style scoped>
        #delete-comment-modal .card.comment {
            margin-block: 10px;
            min-width: 700px;
            max-width: 800px;

            @media screen and (width <= 700px) {
                min-width: auto;
            }
        }
    </style>
{/if}

{#if cancelForm}
    <FormModal title="Discard reply" bind:visible={cancelForm}>
        <p>
            Are you sure that you want to discard this reply? This can't be
            undone!
        </p>
        <div slot="buttons">
            <button
                id="cancel"
                onclick={preventDefault(() => (cancelForm = false))}
                >Cancel</button
            >
            <button
                id="discard"
                onclick={preventDefault(() => {
                    cancelitFr = true;
                    formAction = false;
                    cancelForm = false;
                })}
                class="warning">Discard</button
            >
        </div>
    </FormModal>
{/if}

<div class="comments-list">
    {#each commentShown as comment}
        <div
            class="card comment nkm-comment"
            data-nkm-id={comment.id}
            data-nkm-approved={comment.approved}
        >
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
            <div class="nkm-comment-content">
                {#if comment.content.trim().length > 0}
                    {@html comment.content}
                {:else}
                    <div class="field-warning">
                        <p>
                            No content. This might be because the content has
                            been sanitized out.
                        </p>
                    </div>
                {/if}
            </div>
            <div class="actions">
                <div>
                    <Checkbox
                        class="select-cmts-checkbox"
                        aria-label="Select comment"
                    />
                </div>
                <div>
                    {#if !comment.approved}
                        <button>Approve</button>
                    {:else}
                        <button onclick={() => rplCmt([comment])}>Reply</button>
                    {/if}
                    <button
                        class="warning nkm-delete"
                        onclick={() => delCmt([comment])}>Delete</button
                    >
                    <button class="warning" onclick={() => ipbCmt([comment])}
                        >Block user</button
                    >
                </div>
            </div>
            {#if comment.replies.length > 0}
                <div class="replies">
                    {#each comment.replies as reply}
                        <blockquote
                            class="nkm-comment"
                            data-nkm-id={reply.id}
                            data-nkm-approved={reply.approved}
                            data-nkm-parent-id={comment.id}
                        >
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
                            <h2>{!!reply.author ? reply.author : "No name"}</h2>
                            <div class="nkm-comment-content">
                                {#if reply.content.trim().length > 0}
                                    {@html reply.content}
                                {:else}
                                    <div class="field-warning">
                                        <p>
                                            No content. This might be because
                                            the content has been sanitized out.
                                        </p>
                                    </div>
                                {/if}
                            </div>
                            <div class="actions">
                                <div>
                                    <Checkbox
                                        class="select-cmts-checkbox"
                                        aria-label="Select reply"
                                    />
                                </div>
                                <div>
                                    {#if !reply.approved}
                                        <button>Approve</button>
                                    {/if}
                                    <button
                                        class="warning nkm-delete"
                                        onclick={() => delCmt([reply])}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        class="warning"
                                        onclick={() => ipbCmt([reply])}
                                    >
                                        Block user
                                    </button>
                                </div>
                            </div>
                        </blockquote>
                    {/each}
                </div>
            {/if}
        </div>
    {/each}
    <InfiniteLoading on:infinite={infiniteHandler} />
</div>

<style scoped>
    .comments-list {
        margin-top: 12px;
        display: grid;
        gap: 12px;

        .comment {
            text-decoration: none;
            padding: 10px;
            flex-direction: column;
            gap: 0;

            .heading {
                align-items: start;
            }

            blockquote {
                flex-direction: column;
                margin-left: 24px;
            }

            .review-container {
                display: flex;
                align-items: end;
                height: 100%;
                margin-top: 10px;
            }

            .in-review {
                background: var(--background-red);
                color: var(--color-red);
                padding-inline: 0.4ch;
                border-radius: 5px;
                width: fit-content;
            }
        }
    }

    .comments-actioned {
        max-height: calc(75dvh - 40px   );
        overflow-y: scroll;
    }
</style>
