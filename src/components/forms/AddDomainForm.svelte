<script lang="ts">
    import { plaintext } from "svelte-highlight/languages";
    import CodeBlock from "../code/CodeBlock.svelte";
    import { fly } from 'svelte/transition';

    export let verificationToken: string;

    export let oldStep = 0;
    export let step = 0;
    export let domain = "";
    export let method = "";
    export let err = "";
    
    const subdomains = [
        "neocities.org",
        "nekoweb.org",
        "github.io",
        "pages.dev"
    ]

    function setDomain() {
        if (domain.length < 1 || !domain.includes('.')) {
            alert('Put a valid domain name, please!');
            return;
        }
        if (step == 0) {
            oldStep = step;
            if (subdomains.find(s => domain.includes(s))) setMethod('no-dns')
            else step++;
        }
    }
    function setMethod(value: string) {
        if (step < 2) {
            if (value == "?") {
                alert("I'd take that as a no");
                value = "no-dns";
            }
            method = value;
            oldStep = step;
            step = 2;
        }
    }
    function handleSubmit(e: SubmitEvent) {
        if (step == 0) {
            setDomain();
            e.preventDefault();
        }
        if (step < 2) e.preventDefault(); 
    }

    function f(node: any, options: any) {
        console.log(node, options);
        if (oldStep > options.step) {
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
            <input type="hidden" name="method" bind:value={method} />
            {#if step == 0}
                <section in:f={{ step: 0 }} out:f={{ step: 0, out: true }}>
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
                </section>
            {:else if step == 1}       
                <section in:f={{ step: 1 }} out:f={{ step: 1, out: true }}>
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
                        <button type="button" on:click={() => {oldStep = step; step--}}>
                            Back
                        </button>
                        <span class="flex-fill"></span>
                    </div>
                </section>
            {:else if step == 2}
                <section in:f={{ step: 2 }} out:f={{ step: 2, out: true }}>
                    <h2>Here's the important part:</h2>
                    <p>Verify that you have access to your domain by doing the following:</p>
                    {#if method == "dns"}
                        <p>Create a <b>TXT</b> record for the host <br/><b>_nekomment.{domain}</b><br/>with the following content:</p>
                        <CodeBlock language={plaintext} code={`nekomment-token=${verificationToken}`} />
                    {:else}
                        <p>Create a text file accessible on<br/><b>https://{domain}/.well-known/nekomment</b><br/>with the following content:</p>
                        <CodeBlock language={plaintext} code={`${verificationToken}`} />
                        {#if domain.endsWith(".neocities.org")}
                            <blockquote>
                                <b>Note:</b> If you're using a free Neocities account, you can create your file at <b>/.well-known/nekomment/index.html</b>
                                instead to circumvent the file type limit. <strong>Remember to remove all of the HTML template and only put in the specified text.</strong>
                            </blockquote>
                        {/if}
                    {/if}
                    <p>When you're done, click <b>Verify</b> and your domain will be added to your account.</p>
                    {#if err}
                        <div class="field-error">{err}</div>
                    {/if}
                    <hr>
                    <div class="field-actions">
                        <button type="button" on:click={() => {oldStep = step; if (subdomains.find(s => domain.includes(s))) step = 0; else step--}}>
                            Back
                        </button>
                        <span class="flex-fill"></span>
                        <button class="primary" type="submit">
                            Verify
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

    .big-button {
        text-align: left;

        h3 {
            font-size: 1em;
        }
    }

    .flex-fill {
        flex: 1;
    }

    @media screen and (width <= 640px) {
        .center-form {
            min-width: 100%;
        }
    }
</style>