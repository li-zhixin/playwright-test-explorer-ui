<script lang="ts">
	import { filterStore } from '$lib/stores/filter';
	import { selectionStore } from '$lib/stores/selection';
	import { testDataStore } from '$lib/stores/testData';
	import { loadFailedTestsFromFile } from '$lib/services/fileLoader';
	import { getAllTests } from '$lib/utils/treeUtils';
	import { buildFolderTree } from '$lib/utils/treeBuilder';

	let filterText = $state('');
	let failedTestsFile = $state('');
	let failedTestsInputElement: HTMLInputElement;

	// 同步到 store
	$effect(() => {
		filterStore.setFilterText(filterText);
	});

	async function handleFailedTestsSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const result = await loadFailedTestsFromFile(file);
		if (result.success && result.testIds && result.fileName) {
			filterStore.setFailedTests(result.testIds, result.fileName);
			failedTestsFile = result.fileName;

			// 自动选中所有匹配的失败测试
			const { rootNode } = $testDataStore;
			if (rootNode) {
				const displayTree = buildFolderTree(rootNode);
				if (displayTree) {
					const allTests = getAllTests(displayTree);
					const matchedTests = allTests.filter((test) => result.testIds!.has(test.testId));
					selectionStore.setSelection(new Set(matchedTests));
				}
			}
		} else {
			alert(`解析文件失败: ${result.error}`);
		}
	}

	function openFailedTestsBrowser() {
		failedTestsInputElement?.click();
	}

	function clearFailedTestsFilter() {
		filterStore.clearFailedTests();
		failedTestsFile = '';
	}
</script>

<input
	type="file"
	accept=".json"
	bind:this={failedTestsInputElement}
	onchange={handleFailedTestsSelect}
	style="display: none;"
/>

{#snippet filterSection()}
	<div class="filter-section">
		<div class="filter-header">
			<span class="filter-label">Failed Tests 过滤:</span>
			<button class="btn-filter" onclick={openFailedTestsBrowser}> 选择过滤文件 </button>
		</div>
		{#if failedTestsFile}
			<div class="filter-status">
				<span class="filter-file">
					已加载: {failedTestsFile} ({$filterStore.failedTestIds?.size || 0} 个失败测试)
				</span>
				<button class="btn-clear-filter" onclick={clearFailedTestsFilter}> 清除过滤 </button>
			</div>
		{/if}
	</div>

	<div class="toolbar">
		<input
			type="text"
			class="filter-input"
			bind:value={filterText}
			placeholder="过滤测试..."
		/>
	</div>
{/snippet}

{@render filterSection()}

<style>
	.filter-section {
		padding: 8px 12px;
		border-bottom: 1px solid #e0e0e0;
		background: #fff8e6;
	}

	.filter-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.filter-label {
		font-size: 11px;
		font-weight: 600;
		color: #333;
	}

	.btn-filter {
		padding: 4px 12px;
		font-size: 11px;
		border: 1px solid #ff9800;
		border-radius: 3px;
		background: #ff9800;
		color: #fff;
		cursor: pointer;
		white-space: nowrap;
	}

	.btn-filter:hover {
		background: #f57c00;
		border-color: #f57c00;
	}

	.filter-status {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 6px;
		font-size: 10px;
	}

	.filter-file {
		flex: 1;
		color: #555;
		background: #fff;
		padding: 3px 6px;
		border-radius: 2px;
		border: 1px solid #ffc107;
	}

	.btn-clear-filter {
		padding: 3px 10px;
		font-size: 10px;
		border: 1px solid #ccc;
		border-radius: 3px;
		background: #fff;
		cursor: pointer;
		white-space: nowrap;
	}

	.btn-clear-filter:hover {
		background: #f0f0f0;
	}

	.toolbar {
		padding: 6px 12px;
		border-bottom: 1px solid #e0e0e0;
		background: #fafafa;
	}

	.filter-input {
		width: 100%;
		padding: 4px 8px;
		font-size: 12px;
		border: 1px solid #ccc;
		border-radius: 3px;
	}
</style>
