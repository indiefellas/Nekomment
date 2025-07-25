<script lang="ts">
    export let err: string;
    export let isRegister: boolean = false;
</script>

<div class="fill-screen center-child">
    <div class="center-form">
        {#if isRegister}
            <h1>Register</h1>
        {:else}
            <h1>Log in</h1>
        {/if}
        <form method="post">
            {#if isRegister}
                <div class="field-warning">Please note that Nekomment is still in development phase, so expect bugs!</div>
            {/if}
            {#if err}
                <div class="field-error">{err}</div>
            {/if}
            <div class="field-group">
                <label for="username">Username:</label>
                <input type="text" name="username" id="username" required />
            </div>
            {#if isRegister}
                <div class="field-group">
                    <label for="email">Email address:</label>
                    <input type="email" name="email" id="email" placeholder="johndoe@example.com" required />
                </div>
                <div class="field-group">
                    <label for="domain">Website domain:</label>
                    <input type="text" name="domain" id="domain" placeholder="johndoe.example.com" required />
                </div>
            {/if}
            <div class="field-group">
                <label for="password">Password:</label>
                <input type="password" name="password" id="password" required minlength="8" />
            </div>
            {#if isRegister}
                <div class="field-group">
                    <label for="password2">Password again, just to be sure:</label>
                    <input type="password" name="password2" id="password2" required minlength="8" />
                </div>
            {/if}
            <hr>
            <div class="field-actions">
                {#if !isRegister}
                <button type="submit">
                    Forgot password
                </button>
                {/if}
                <button class="primary" type="submit">
                    {isRegister ? "Register!" : "Login!"}
                </button>
            </div>
        </form>
    </div>
</div>

<style scoped>
    .center-form {
        width: 400px;
    }

    h1 {
        margin-bottom: 10px;
    }
</style>