<script lang="ts">
	import TestExplorer from '$lib/components/TestExplorer.svelte';
	import SelectedTests from '$lib/components/SelectedTests.svelte';
	import type { SuiteItem, TestItem } from '$lib/types';

	let rootNode = $state<SuiteItem | null>(null);
	let selectedTests = $state<Set<TestItem>>(new Set());
	let currentFile = $state('');
	let rightPanelWidth = $state(400); // 右侧面板的初始宽度
	let isDragging = $state(false);

	function handleSelectionChange(newSelection: Set<TestItem>) {
		selectedTests = newSelection;
	}

	function handleFileChange(file: string) {
		currentFile = file;
	}

	// 开始拖动
	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		document.body.classList.add('resizing');
		e.preventDefault();
	}

	// 拖动中
	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;

		const containerWidth = window.innerWidth;
		const newRightWidth = containerWidth - e.clientX;

		// 限制最小和最大宽度
		const minWidth = 200;
		const maxWidth = containerWidth - 200;

		rightPanelWidth = Math.max(minWidth, Math.min(maxWidth, newRightWidth));
	}

	// 结束拖动
	function handleMouseUp() {
		isDragging = false;
		document.body.classList.remove('resizing');
	}
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

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
	<div class="resizer" onmousedown={handleMouseDown} class:dragging={isDragging}></div>
	<div class="right-panel" style="width: {rightPanelWidth}px;">
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

	:global(body.resizing) {
		cursor: col-resize;
		user-select: none;
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

	.resizer {
		width: 4px;
		background: #e0e0e0;
		cursor: col-resize;
		flex-shrink: 0;
		position: relative;
		transition: background 0.2s ease;
	}

	.resizer:hover {
		background: #007acc;
	}

	.resizer.dragging {
		background: #007acc;
	}

	.resizer::before {
		content: '';
		position: absolute;
		top: 0;
		left: -2px;
		right: -2px;
		bottom: 0;
	}

	.right-panel {
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.app-container {
			flex-direction: column;
		}

		.left-panel {
			flex: 1;
		}

		.resizer {
			display: none;
		}

		.right-panel {
			width: 100% !important;
			max-height: 300px;
			border-left: none;
			border-top: 1px solid #e0e0e0;
		}
	}
</style>
