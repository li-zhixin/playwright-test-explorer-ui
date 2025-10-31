<script lang="ts">
	import TestExplorer from '$lib/components/TestExplorer.svelte';
	import SelectedTests from '$lib/components/SelectedTests.svelte';
	import type { SuiteItem, TestItem } from '$lib/types';

	let rootNode = $state<SuiteItem | null>(null);
	let selectedTests = $state<Set<TestItem>>(new Set());
	let currentFile = $state('');

	function handleSelectionChange(newSelection: Set<TestItem>) {
		selectedTests = newSelection;
	}

	function handleFileChange(file: string) {
		currentFile = file;
	}
</script>

<svelte:head>
	<title>Playwright Test Explorer</title>
</svelte:head>

<div class="app-container">
	<div class="left-panel">
		<TestExplorer
			bind:rootNode
			bind:selectedTests
			onSelectionChange={handleSelectionChange}
			{currentFile}
			onFileChange={handleFileChange}
		/>
	</div>
	<div class="right-panel">
		<SelectedTests {selectedTests} {rootNode} />
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
	}

	.app-container {
		display: flex;
		height: 100vh;
		overflow: hidden;
	}

	.left-panel {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.right-panel {
		width: 400px;
		display: flex;
		flex-direction: column;
		border-left: 1px solid #e0e0e0;
	}

	@media (max-width: 768px) {
		.app-container {
			flex-direction: column;
		}

		.left-panel {
			flex: 1;
		}

		.right-panel {
			width: 100%;
			max-height: 300px;
			border-left: none;
			border-top: 1px solid #e0e0e0;
		}
	}
</style>
