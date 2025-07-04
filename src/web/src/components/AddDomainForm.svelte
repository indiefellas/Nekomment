<script lang="ts">
    import { plaintext } from "svelte-highlight/languages";
    import CodeBlock from "./CodeBlock.svelte";

    export let verificationToken: string;

    export let step = 0;
    export let domain = "";
    export let method = "";

    function setDomain() {
        if (step == 0) {
            step++;
        }
    }
    function setMethod(value: string) {
        if (step == 1) {
            if (value == "?") {
                alert("I'd take that as a no");
                value = "no-dns";
            }
            method = value;
            step++;
        }
    }
    function handleSubmit(e: SubmitEvent) {
        if (step < 2) e.preventDefault();
    }
</script>

<div class="fill-screen center-child">
    <div class="center-form">
        <form method="post" on:submit={handleSubmit}>
            <input type="hidden" name="domain" bind:value={domain} />
            <input type="hidden" name="method" bind:value={method} />
            {#if step == 0}
                <h2>Add domain to Nekomment</h2>
                <div class="field-group">
                    <label for="domain">First things first, what is your website's domain?</label>
                    <input type="text" bind:value={domain} id="domain" placeholder="example.com" required />
                </div>
                <hr>
                <div class="field-actions">
                    <button class="primary" type="button" on:click={() => setDomain()}>
                        Next
                    </button>
                </div>
            {:else if step == 1}
                <h2>Trivia question:</h2>
                <p>Can you change your domain's DNS records?</p>
                <button class="big-button" type="button" on:click={() => setMethod("dns")}>
                    <h3>Yes</h3>
                    I own my domain name
                </button>
                <button class="big-button" type="button" on:click={() => setMethod("no-dns")}>
                    <h3>No</h3>
                    My domain comes with my web host
                </button>
                <button class="big-button" type="button" on:click={() => setMethod("?")}>
                    <h3>What's DNS?</h3>
                    Is it edible?
                </button>
                <hr>
                <div class="field-actions">
                    <button type="button" on:click={() => step--}>
                        Back
                    </button>
                    <span class="flex-fill"></span>
                </div>
            {:else if step == 2}
                <h2>Here's the important part:</h2>
                <p>Verify that you have access to your domain by doing the following:</p>
                {#if method == "dns"}
                    <p>Create a <b>TXT</b> record for the host <br/><b>_nekomment.{domain}</b><br/>with the following content:</p>
                    <CodeBlock language={plaintext} code={`nekomment-token=${verificationToken}`} />
                {:else}
                    <p>Create a text file accessible on<br/><b>https://{domain}/.well_known/nekomment</b><br/>with the following content:</p>
                    <CodeBlock language={plaintext} code={`nekomment-token=${verificationToken}`} />
                    {#if domain.endsWith(".neocities.org")}
                        <blockquote>
                            <b>Note:</b> If you're using a free Neocities account, you can create your file at <b>/.well_known/nekomment/index.html</b>
                            instead to circumvent the file type limit. <strong>Remember to remove all of the HTML template and only put in the specified text.</strong>
                        </blockquote>
                    {/if}
                {/if}
                <p>When you're done, click <b>Verify</b> and your domain will be added to your account.</p>
                <hr>
                <div class="field-actions">
                    <button type="button" on:click={() => step--}>
                        Back
                    </button>
                    <span class="flex-fill"></span>
                    <button class="primary" type="submit">
                        Verify
                    </button>
                </div>
            {/if}
        </form>
    </div>
</div>

<style scoped>
    .center-form {
        width: 600px;
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
</style>