<script lang="ts">
    import Icon from "@iconify/svelte";
    import { onMount } from "svelte";
    let { commentCount, filteredCommentsCount } = $props();

    let filterBtn: HTMLDivElement;
    function loadFilter() {
        filterBtn.classList.toggle('visible');
    }

    let qa: string = $state(''), 
        qc: string = $state(''),
        qip: string = $state(''),
        url: string = $state('');
    onMount(() => {
        let params = new URL(window.location.href).searchParams;
        qa = params.get('qa')
        qc = params.get('qc')
        qip = params.get('qip')
        let u = (new URL(window.location.href));
        u.search = '';
        url = u.href;
    })
</script>

<div class="site-options">
    <button aria-label="Site options" onclick={loadFilter}>
        {qa || qc || qip ? `Filtered: ${filteredCommentsCount}/${commentCount}` : 'Filter...'}
    </button>
    
    <div class="options" bind:this={filterBtn}>
        <form>
            <h2>Filter on...</h2>
            <div class="field-group">
                <label for="author">Comment author contains</label>
                <input type="text" id="author" name="qa" value={qa} />
            </div>
            <div class="field-group">
                <label for="content">Comment content contains</label>
                <input type="text" id="content" name="qc" value={qc} />
            </div>
            <div class="field-group">
                <label for="address">Comment IP address contains</label>
                <input type="text" id="address" name="qip" value={qip} />
            </div>
            <div class="side">
                <a href={url} class="button">Clear</a>
                <button class="primary" type="submit">Filter</button>
            </div>
        </form>
    </div>    
</div>

<style scoped>
    .site-options {
        position: relative;
        display: inline-block;

        .options {
            position: absolute;
            top: 100%;
            transform: scale(0.8);
            transform-origin: top right;
            right: 0;
            background-color: var(--background-3);
            border-radius: 3px;
            padding: 0.5em 1.2ch;
            z-index: 50;
            display: flex;
            width: max-content;
            flex-direction: column;
            margin-block: 5px;
            gap: 10px;
            opacity: 0;
            pointer-events: none;
            box-shadow: var(--shadow-2);
            a {
                text-decoration: none;
            }

            &:global(.visible) {
                opacity: 1;
                pointer-events: all;
                transform: none;
            }

            .side {
                display: flex;
                gap: 5px;
                justify-content: end;
            }
        }
    }
</style>