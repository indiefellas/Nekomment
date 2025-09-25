<script lang="ts">
    import { plaintext } from "svelte-highlight/languages";
    import CodeBlock from "../code/CodeBlock.svelte";
    import { fly } from 'svelte/transition';
    import type { comments, Host } from "../../db/schema";
    import Icon from "@iconify/svelte";

    export let oldStep = 0;
    export let step = 0;
    export let from = "";
    export let param = "";
    export let name = "";
    export let err = "";

    function setFrom(host: string) {
        if (step == 0) {
            from = host;
            oldStep = step;
            step++;
            console.log(step, host);
        }
    }
    function setparam(value: string) {
        if (step < 2) {
            param = value;
            oldStep = step;
            step = 2;
        }
    }
    function handleSubmit(e: SubmitEvent) {
        if (step < 1) e.preventDefault(); 
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
            <input type="hidden" name="from" bind:value={from} />
            <input type="hidden" name="param" bind:value={param} />
            {#if step == 0}
                <section in:f={{ step: 0 }} out:f={{ step: 0, out: true }}>
                    <h2>Import existing comments</h2>
                    <div class="field-group">
                        <label for="from">What comment service you are importing from?</label>
                        <button class="big-button" type="button" on:click={() => setFrom("ayano")}>
                            <h3>Ayano's Comment Widget</h3>
                            The widget that uses Google Sheets, creatively
                        </button>
                        <button class="big-button" type="button" disabled on:click={() => setFrom("hcb")}>
                            <h3>HTML Comment Box</h3>
                            An easy way to get comments to a site (soon)
                        </button>
                        <!-- <button class="big-button" type="button" on:click={() => setFrom("atabook")}>
                            <h3>Atabook</h3>
                            The replacement for 123Guestbook
                        </button>
                        <button class="big-button" type="button" on:click={() => setFrom("cbox")}>
                            <h3>Cbox</h3>
                            A live chat platform<br />
                            <p class="small">
                                Note: Nekomment is a comments solution, not a live chat platform
                            </p>
                        </button>
                        <button class="big-button" type="button" on:click={() => setFrom("chattable")}>
                            <h3>Chattable</h3>
                            Another live chat platform<br />
                            <p class="small">
                                Note: Nekomment is a comments solution, not a live chat platform
                            </p>
                        </button> -->
                        <button class="big-button" type="button" disabled on:click={() => setFrom("file")}>
                            <h3>JSON/CSV data</h3>
                            When you have the file in hand (soon)
                        </button>
                        <button class="big-button" type="button" disabled on:click={() => setparam("?")}>
                            <h3>Whatever is this</h3>
                            maybe soon
                        </button>
                    </div>
                </section>
            {:else if step == 1}       
                <section in:f={{ step: 1 }} out:f={{ step: 1, out: true }}>
                    <h2>Here's the important part:</h2>

                    <div class="field-group">
                        {#if err}
                            <div class="field-error">{err}</div>
                        {/if}
                        {#if from === 'ayano'}
                            <label for="sheetsUrl">What is your Google Sheets URL for your comments?</label>
                            <blockquote>
                                Please make sure that everyone has read access on it, else we can't get comments on your site.
                                <p class="small">This should also import some Ayano's Comment Widget addons. See Nekomment Docs for more info.</p>
                                <p class="small">Code for importing comments is taken directly on Ayano's Comment Widget code.</p>
                            </blockquote>
                            <input type="text" name="sheetsUrl" placeholder="https://docs.google.com/spreadsheets/d/1G0WA49Y7..." />
                        {:else if from === 'hcb' || from === 'file'}
                            <label for="fileUploaded">Upload the {#if from === 'hcb'}JSON{:else}JSON/CSV{/if} file here.</label>
                            <blockquote>
                                {#if from === 'hcb'}
                                    <a href="https://www.htmlcommentbox.com/received.html" target="_blank">Go to this page</a>, scroll down to Export, and press JSON. That should export your data.
                                {:else}
                                    Wanna see what schemas we support? See Nekomment Docs!  
                                {/if}
                            </blockquote>
                            <input type="file" name="fileUploaded">
                        {/if}
                    </div>
                    <hr>
                    <div class="field-actions">
                        <button type="button" on:click={() => {oldStep = step; step--}}>
                            Back
                        </button>
                        <span class="flex-fill"></span>
                        <button class="primary" type="submit">
                            Import comment
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