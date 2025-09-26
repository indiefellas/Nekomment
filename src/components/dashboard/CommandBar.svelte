<script lang="ts">
    import { onMount } from "svelte";
    import lodash from "lodash";
    import FilterButton from "../buttons/FilterButton.svelte";
    const { uniq } = lodash;

    let commentsSelected: string[] = $state([]);
    let requiresReview = $state(0);

    let { pathname, commentCount, filteredCommentsCount } = $props();
    let header: Element | undefined = $state();

    $effect.pre(() => {
        if (header) {
            document.addEventListener("scroll", () => {
                if (window.scrollY > 15) {
                    header.classList.add("header-scroll");
                } else {
                    header.classList.remove("header-scroll");
                }
            });

            if (window.scrollY > 15) {
                header.classList.add("header-scroll");
            } else {
                header.classList.remove("header-scroll");
            }
        }

        if (commentsSelected.length === 0) {
            document.querySelectorAll('.select-cmts-checkbox input').forEach(c => (c as HTMLInputElement).checked = false);
        }
    })

    onMount(() => {
        setInterval(() => initCheckboxes(), 250);
        initCheckboxes();
    })

    function dev(event: string) {
        const ev = new CustomEvent("nkm:bev", { detail: { type: event, ids: commentsSelected } })
        document.dispatchEvent(ev);
    }

    function selectAll() {
        document.querySelectorAll('.select-cmts-checkbox input').forEach(e => {
            const elm = e as HTMLInputElement;
            const parent = elm.parentElement?.parentElement?.parentElement?.parentElement;
            if (!elm.checked) {
                elm.checked = true;
                commentsSelected.push(parent?.dataset.nkmId ?? '');
                if (elm.dataset.nkmApproved==="false") requiresReview++;
            }

            if (parent?.querySelector('blockquote')) {
                parent?.querySelectorAll('blockquote').forEach(r => {
                    if (!(e as HTMLInputElement).checked) {
                        (e as HTMLInputElement).checked = true;
                        commentsSelected.push(r.dataset.nkmId ?? '');
                        if (r.dataset.nkmApproved==="false") requiresReview++;
                    }
                });
            }
        });
    }

    function initCheckboxes() {
        document.querySelectorAll('.select-cmts-checkbox input').forEach(e => {
            const elm = e as HTMLInputElement;
            if (elm.dataset.barEvent) return;
            else elm.dataset.barEvent = "true";
            const parent = elm.parentElement?.parentElement?.parentElement?.parentElement;

            elm.addEventListener('change', () => {
                if (elm.checked) {
                    commentsSelected.push(parent?.dataset.nkmId ?? '');
                    if (elm.dataset.nkmApproved==="false") requiresReview++;
                } else {
                    commentsSelected = commentsSelected.filter(i => i !== parent?.dataset.nkmId);
                    if (elm.dataset.nkmApproved==="false") requiresReview--;
                }
                if (parent?.querySelector('blockquote')) {
                    parent?.querySelectorAll('blockquote').forEach(r => {
                        const e = r.querySelector('.select-cmts-checkbox input');
                        (e as HTMLInputElement).checked = elm.checked;
                        if (elm.checked) {
                            commentsSelected.push(r.dataset.nkmId ?? '');
                            if (r.dataset.nkmApproved==="false") requiresReview++;
                        } else {
                            commentsSelected = commentsSelected.filter(i => i !== r.dataset.nkmId);
                            if (r.dataset.nkmApproved==="false") requiresReview--;
                        }
                        (e as HTMLInputElement).disabled = elm.checked;
                    })
                }

                commentsSelected = uniq(commentsSelected);
            })
        })
    }
</script>

<div class="heading">
    <h1>Comments</h1>
    <div>
        <a href={pathname + "/import"} class="button primary">Import...</a>
        <FilterButton {commentCount} {filteredCommentsCount} />
    </div>
</div>

{#if commentsSelected.length > 0}
    <div class="command-bar" bind:this={header}>
        <div class="select-items-buttons">
            <p>{commentsSelected.length} selected</p>
        </div>
        <div>
            <button onclick={()=>selectAll()}>Select all</button>
            <button onclick={()=>commentsSelected = []}>Remove selection</button>
            {#if requiresReview > 0}
                <button>Approve</button>
            {/if}
            <button onclick={()=>dev("delete")} class="warning nkm-delete">Delete</button>
            <button onclick={()=>dev("block")} class="warning">Block user</button>
        </div>
    </div>
{/if}

<style scoped>
    .heading {
        display: flex;
        justify-content: space-between;
        align-items: end;
        width: 100%;
        margin-bottom: 10px;
    }

    .command-bar {
        margin-top: 5px;
        padding-block: 10px;
        display: flex;
        position: sticky;
        justify-content: space-between;
        flex-wrap: wrap;
        z-index: 30;
        top: 70px;
        gap: 5px;

        &>div {
            display: flex;
            gap: 5px;
        }

        :global(&.header-scroll) {
            background-color: var(--background-2);
            padding-inline: 10px;
            margin-inline: 10px;
            border-radius: 7px; 
        }
    }

    .select-items-buttons {
        display: flex;
        gap: 5px;
        align-items: center;
        flex-wrap: wrap;
    }
</style>