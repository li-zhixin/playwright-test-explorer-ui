<script lang="ts">
	import SelectedTestsList from './SelectedTestsList.svelte';
	import TextExportPanel from './TextExportPanel.svelte';
	import { testDataStore } from '$lib/stores/testData';
	import { selectionStore } from '$lib/stores/selection';
	import { getAllTestsInFile, findTestPath } from '$lib/utils/treeUtils';
	import type { TestItem, TreeNode } from '$lib/types';

	let expandedFiles = $state<Set<string>>(new Set());
	let textSectionHeight = $state(150);
	let isResizing = $state(false);

	const selectedArray = $derived(Array.from($selectionStore));

	interface FileGroup {
		file: string;
		tests: TestItem[];
		allSelected: boolean;
		totalInFile: number;
	}

	// 按文件分组测试
	const groupedByFile = $derived.by(() => {
		const fileMap = new Map<string, TestItem[]>();

		selectedArray.forEach((test) => {
			const file = test.location.file;
			if (!fileMap.has(file)) {
				fileMap.set(file, []);
			}
			fileMap.get(file)!.push(test);
		});

		return Array.from(fileMap.entries())
			.map(([file, tests]) => {
				const allTestsInFile = $testDataStore.rootNode
					? getAllTestsInFile($testDataStore.rootNode, file)
					: [];
				const totalInFile = allTestsInFile.length;
				const allSelected = totalInFile > 0 && tests.length === totalInFile;

				return {
					file,
					tests: tests.sort((a, b) => a.location.line - b.location.line),
					allSelected,
					totalInFile
				};
			})
			.sort((a, b) => a.file.localeCompare(b.file));
	});

	// 构建测试的完整路径
	function buildFullTestPath(test: TestItem): string {
		if (!$testDataStore.rootNode) {
			return `${test.location.file}:${test.location.line}`;
		}

		const path = findTestPath($testDataStore.rootNode, test, []);
		if (path.length === 0) {
			return `${test.location.file}:${test.location.line}`;
		}

		return path.join(' › ');
	}

	// 生成文本显示
	const textDisplay = $derived.by(() => {
		const result: string[] = [];
		groupedByFile.forEach((group) => {
			group.tests.forEach((test) => {
				result.push(buildFullTestPath(test));
			});
		});
		return result.join('\n');
	});

	function toggleFileExpand(file: string) {
		const newExpanded = new Set(expandedFiles);
		if (newExpanded.has(file)) {
			newExpanded.delete(file);
		} else {
			newExpanded.add(file);
		}
		expandedFiles = newExpanded;
	}

	function handleResizeStart(e: MouseEvent) {
		isResizing = true;
		document.body.classList.add('text-resizing');
		e.preventDefault();
	}

	function handleResizeMove(e: MouseEvent) {
		if (!isResizing) return;

		const container = document.querySelector('.selected-tests') as HTMLElement;
		if (!container) return;

		const containerRect = container.getBoundingClientRect();
		const newHeight = containerRect.bottom - e.clientY;

		const minHeight = 80;
		const maxHeight = containerRect.height - 150;

		textSectionHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
	}

	function handleResizeEnd() {
		isResizing = false;
		document.body.classList.remove('text-resizing');
	}

	function downloadTestList() {
		const content = textDisplay;
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'test-list';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<svelte:window onmousemove={handleResizeMove} onmouseup={handleResizeEnd} />

<div class="selected-tests">
	<div class="selected-header">
		<h2 class="selected-title">选中的测试</h2>
		<span class="selected-count">{selectedArray.length} 个测试</span>
	</div>

	<SelectedTestsList
		{groupedByFile}
		{expandedFiles}
		onToggleExpand={toggleFileExpand}
	/>

	<TextExportPanel
		{textDisplay}
		disabled={selectedArray.length === 0}
		height={textSectionHeight}
		onDownload={downloadTestList}
		onResizeStart={handleResizeStart}
		{isResizing}
	/>
</div>

<style>
	:global(body.text-resizing) {
		cursor: row-resize;
		user-select: none;
	}

	.selected-tests {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #fff;
	}

	.selected-header {
		padding: 8px 12px;
		border-bottom: 1px solid #e0e0e0;
		background: #f5f5f5;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.selected-title {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
	}

	.selected-count {
		font-size: 12px;
		color: #666;
		background: #e0e0e0;
		padding: 2px 8px;
		border-radius: 10px;
	}
</style>
