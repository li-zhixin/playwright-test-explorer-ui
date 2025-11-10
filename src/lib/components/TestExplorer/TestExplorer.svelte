<script lang="ts">
	import FileLoader from './FileLoader.svelte';
	import FilterPanel from './FilterPanel.svelte';
	import TestTree from './TestTree.svelte';
	import { testDataStore } from '$lib/stores/testData';
</script>

<div class="test-explorer">
	<div class="explorer-header">
		<h2 class="explorer-title">Test Explorer</h2>
	</div>

	<FileLoader />

	{#if $testDataStore.currentFile}
		<div class="current-file">当前文件: {$testDataStore.currentFile}</div>
	{/if}

	<FilterPanel />

	<TestTree />
</div>

<style>
	.test-explorer {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #fff;
		border-right: 1px solid #e0e0e0;
	}

	.explorer-header {
		padding: 8px 12px;
		border-bottom: 1px solid #e0e0e0;
		background: #f5f5f5;
	}

	.explorer-title {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
	}

	.current-file {
		font-size: 10px;
		color: #666;
		padding: 4px 12px;
		background: #fafafa;
		border-bottom: 1px solid #e0e0e0;
	}
</style>
