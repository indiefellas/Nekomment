<script lang="ts">
    import FormModal from "./FormModal.svelte";

    let { availableEmojis } = $props();

    function openEmojiPicker(textarea: HTMLTextAreaElement) {

    }
</script>

<FormModal onsubmit={(ev) => { 
    ev.preventDefault()
}}>

</FormModal>