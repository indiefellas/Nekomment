<script lang="ts">
    export let err: string;
    export let isRegister: boolean = false;
</script>

<div class="fill-screen center-child">
    <div class="center-form">
        <p>{err}</p>
        <form method="post">
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
</style>