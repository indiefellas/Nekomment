<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
    const { code } = $props();

    let editor: Monaco.editor.IStandaloneCodeEditor | undefined;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement;

	onMount(async () => {
		monaco = (await import('../../lib/monaco')).default;

		const editor = monaco.editor.create(editorContainer);
		const model = monaco.editor.createModel(
			code,
			'handlebars'
		);
		editor.setModel(model);
	});

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
	});
</script>

<div class="nkm-editor-container" bind:this={editorContainer}>
	
</div>

<style>
	.nkm-editor-container {
		width: 100%;
		height: 100%;
	}

    * {
        transition: none !important;
    }
</style>