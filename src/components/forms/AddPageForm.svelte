<script lang="ts">
    import { plaintext } from "svelte-highlight/languages";
    import CodeBlock from "../code/CodeBlock.svelte";
    import { fly } from 'svelte/transition';
    import type { comments, Host } from "../../db/schema";
    import Icon from "@iconify/svelte";

    export let hosts: {
        host: string;
        ownerId: number;
        settingsId: number | null;
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
        }[];
    }[];

    export let oldStep = 0;
    export let step = 0;
    export let domain = "";
    export let theme = "";
    export let name = "";
    export let err = "";

    function setHost(host: string) {
        if (step == 0) {
            domain = host;
            oldStep = step;
            step++;
        }
    }
    function setTheme(value: string) {
        if (step < 2) {
            theme = value;
            oldStep = step;
            step = 2;
        }
    }
    function handleSubmit(e: SubmitEvent) {
        if (step < 2) e.preventDefault(); 
    }

    function f(node: any, options: any) {
        console.log(node, options);
        if (oldStep > step && options.step < oldStep) {
            return fly(node, { x: options.out ? 200 : -200 });
        } else {
            return fly(node, { x: options.out ? -200 : 200 });
        }
    }
</script>

<div class="fill-screen center-child">
    <div class="center-form">
        <form method="post" on:submit={handleSubmit}>
            <input type="hidden" name="domain" bind:value={domain} />
            <input type="hidden" name="theme" bind:value={theme} />
            {#if step == 0}
                <section in:f={{ step: 0 }} out:f={{ step: 0, out: true }}>
                    <h2>Create new page</h2>
                    <div class="field-group">
                        <label for="domain">First things first, what domain do you want to use for this Page?</label>
                        {#each hosts as host}
                            <button type="button" class="big-button" on:click={() => setHost(host.host)}>
                                <h2>{host.host}</h2>
                                <div class="host-stats">
                                    <p>
                                        <Icon icon="material-symbols:comment" inline />
                                        {host.comments.length}
                                    </p>
                                    {#if host.comments.filter(c => !c.approved).length > 0}
                                        <p class="in-review">
                                            <Icon icon="garden:moderation-26" inline />
                                            {host.comments.filter(c => !c.approved).length} in review
                                        </p>
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    </div>
                </section>
            {:else if step == 1}       
                <section in:f={{ step: 1 }} out:f={{ step: 1, out: true }}>
                    <h2>Creating page for {domain}</h2>
                    <p>Now, what template you wanna use for your comment page?</p>
                    <button class="big-button" type="button" on:click={() => setTheme("default")}>
                        <h3>Default theme</h3>
                        The first theme we put here
                    </button>
                    <button class="big-button" type="button" on:click={() => setTheme("raw")}>
                        <h3>Barebones</h3>
                        When you like it raw
                    </button>
                    <button class="big-button" type="button" disabled on:click={() => setTheme("?")}>
                        <h3>Whatever is this</h3>
                        maybe soon
                    </button>
                    <hr>
                    <div class="field-actions">
                        <button type="button" on:click={() => {oldStep = step; step--}}>
                            Back
                        </button>
                        <span class="flex-fill"></span>
                    </div>
                </section>
            {:else if step == 2}
                <section in:f={{ step: 2 }} out:f={{ step: 2, out: true }}>
                    <h2>Here's the important part:</h2>
                    <p>What would be the name of your comment page?</p>
                    <div class="special-text">
                        <p>https://cmt.nkko.link/c/</p>
                        <input type="text" name="name" aria-label="The name of your comment page" placeholder="Comment page name" bind:value={name} />
                    </div>
                    {#if err}
                        <div class="field-error">{err}</div>
                    {/if}
                    <hr>
                    <div class="field-actions">
                        <button type="button" on:click={() => {oldStep = step; step--}}>
                            Back
                        </button>
                        <span class="flex-fill"></span>
                        <button class="primary" type="submit">
                            Create page
                        </button>
                    </div>
                </section>
            {/if}
        </form>
    </div>
</div>

<style scoped>
    .center-form {
        position: relative;
        min-width: 600px;
        height: 100%;
		display: flex;
        overflow: hidden;

        form {
            min-width: 100%;
        }

        section {
            position:relative;
            inset: 0;
            min-width: 100%;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        :global(&:has(section[inert]) section[inert]) {
            position: absolute;
        }
    }

    .special-text {
        background-color: var(--btn-base-bg);
        border-radius: 5px;
        display: flex;
        align-items: center;
        padding: 5px;
        p {
            opacity: 0.8;
        }
        input[type='text'] {
            background-color: transparent;
            width: 100%;
            flex-grow: 1;
            flex-basis: 0;
            padding: 2px;
            border-radius: 0;
        }

    }

    .big-button {
        text-align: left;

        h3 {
            font-size: 1em;
        }
    }

    .flex-fill {
        flex: 1;
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
        .center-form {
            min-width: 100%;
        }
    }
</style>