<script lang="ts">
    import { onMount } from "svelte";

    const { children, title, event = 'form-modal-clicked', ...args } = $props();
    let form: HTMLFormElement;
    let modal: HTMLDivElement;

    onMount(()=>{
        form.addEventListener(event, ()=>{
            modal.classList.toggle('visible');
        })
    })
</script>

<div class="form-modal" bind:this={modal}>
    <div class="form-bg"></div>
    <form class="center-form" method="post" {...args} bind:this={form}>
        <div class="title">
            <h2>{title}</h2>
        </div>
        <!-- svelte-ignore slot_element_deprecated -->
        <div class="rest">
            <slot></slot>
        </div>
        <hr />
        <!-- svelte-ignore slot_element_deprecated -->
        <div class="buttons">
            <slot name="buttons"></slot>
        </div>
    </form>
</div>

<style scoped>
    .form-modal {
        visibility: hidden;
        position: fixed;
        inset: 0;
        width: 100dvw;
        height: 100dvh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
        opacity: 0;

        .form-bg {
            position: fixed;
            inset: 0;
            background-color: var(--background-1);
            width: 100dvw;
            height: 100dvh;
            z-index: 1001;
            opacity: 0.75;
        }

        form {
            position: relative;
            display: flex;
            flex-direction: column;
            z-index: 1002;

            .title {
                display: flex;
                justify-content: space-between;
                padding-bottom: 0;
                width: 100%;
                gap: 30px;
            }

            .rest {
                padding-top: 0;

                flex-basis: 0;
                flex-grow: 1;
            }

            .buttons {
                display: flex;
                justify-content: end;
                gap: 6px;
            }
        }
    }

    :global(.form-modal.visible) {
        visibility: visible;
        opacity: 1;
    }

    :global(body:has(.form-modal.visible)) {
        overflow: hidden;
    }
</style>