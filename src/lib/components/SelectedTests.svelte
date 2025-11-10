<script lang="ts">
	import type { TestItem, TestNode, SuiteItem, TreeNode } from '$lib/types';

	interface Props {
		selectedTests: Set<TestItem>;
		rootNode: SuiteItem | null;
	}

	let { selectedTests, rootNode }: Props = $props();

	const selectedArray = $derived(Array.from(selectedTests));

	// 跟踪每个文件的展开状态
	let expandedFiles = $state<Set<string>>(new Set());

	// 文本区域高度控制
	let textSectionHeight = $state(150); // 初始高度
	let isResizing = $state(false);

	// 获取文件中所有测试用例
	function getAllTestsInFile(node: TreeNode, targetFile: string): TestItem[] {
		if (node.type === 'test') {
			return node.location.file === targetFile ? [node] : [];
		} else if (node.type === 'suite' || node.type === 'folder') {
			return node.children.flatMap(child => getAllTestsInFile(child, targetFile));
		}
		return [];
	}

	// 构建测试的完整路径（file › suite1 › suite2 › test）
	function buildFullTestPath(test: TestItem): string {
		if (!rootNode) {
			return `${test.location.file}:${test.location.line}`;
		}

		// 在树中查找测试并构建路径
		const path = findTestPath(rootNode, test, []);
		if (path.length === 0) {
			return `${test.location.file}:${test.location.line}`;
		}

		return path.join(' › ');
	}

	// 递归查找测试并构建其路径
	function findTestPath(node: TreeNode, targetTest: TestItem, currentPath: string[]): string[] {
		if (node.type === 'test') {
			if (node === targetTest || node.testId === targetTest.testId) {
				return [...currentPath, node.title];
			}
			return [];
		}

		if (node.type === 'suite') {
			let newPath: string[];

			if (node.file) {
				// 检查当前路径中是否已经有文件路径
				const hasFilePath = currentPath.length > 0 && currentPath[0].includes('/');

				if (hasFilePath) {
					// 已经有文件路径了，这是嵌套的 suite，添加 title
					newPath = [...currentPath, node.title];
				} else {
					// 这是文件级别的 suite，使用文件路径作为起点
					newPath = [node.file];
				}
			} else {
				// 没有 file 属性的 suite（如 Root, chromium 等），添加 title
				newPath = [...currentPath, node.title];
			}

			for (const child of node.children) {
				const result = findTestPath(child, targetTest, newPath);
				if (result.length > 0) {
					return result;
				}
			}
		} else if (node.type === 'folder') {
			// folder 不添加到路径中，直接搜索子节点
			for (const child of node.children) {
				const result = findTestPath(child, targetTest, currentPath);
				if (result.length > 0) {
					return result;
				}
			}
		}

		return [];
	}

	// 按文件分组测试
	interface FileGroup {
		file: string;
		tests: TestItem[];
		allSelected: boolean;
		totalInFile: number;
	}

	const groupedByFile = $derived.by(() => {
		const fileMap = new Map<string, TestItem[]>();
		
		// 按文件分组选中的测试
		selectedArray.forEach(test => {
			const file = test.location.file;
			if (!fileMap.has(file)) {
				fileMap.set(file, []);
			}
			fileMap.get(file)!.push(test);
		});

		// 转换为数组并检查是否全选
		return Array.from(fileMap.entries())
			.map(([file, tests]) => {
				// 获取该文件中所有测试用例的数量
				const allTestsInFile = rootNode ? getAllTestsInFile(rootNode, file) : [];
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

	// 生成文本显示（换行符分隔）
	const textDisplay = $derived.by(() => {
		const result: string[] = [];

		groupedByFile.forEach(group => {
			// 统一显示每个测试的完整路径（file › suite › test）
			group.tests.forEach(test => {
				result.push(buildFullTestPath(test));
			});
		});

		return result.join('\n');
	});

	// 切换文件展开状态
	function toggleFileExpand(file: string) {
		const newExpanded = new Set(expandedFiles);
		if (newExpanded.has(file)) {
			newExpanded.delete(file);
		} else {
			newExpanded.add(file);
		}
		expandedFiles = newExpanded;
	}

	// 开始调整文本区域高度
	function handleResizeStart(e: MouseEvent) {
		isResizing = true;
		document.body.classList.add('text-resizing');
		e.preventDefault();
	}

	// 调整文本区域高度
	function handleResizeMove(e: MouseEvent) {
		if (!isResizing) return;

		const container = document.querySelector('.selected-tests') as HTMLElement;
		if (!container) return;

		const containerRect = container.getBoundingClientRect();
		const newHeight = containerRect.bottom - e.clientY;

		// 限制最小和最大高度
		const minHeight = 80;
		const maxHeight = containerRect.height - 150; // 保证列表区域至少150px

		textSectionHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
	}

	// 结束调整
	function handleResizeEnd() {
		isResizing = false;
		document.body.classList.remove('text-resizing');
	}

	// 下载测试列表
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

	<div class="selected-list">
		{#if selectedArray.length === 0}
			<div class="empty-message">未选择任何测试</div>
		{:else}
			{#each groupedByFile as group (group.file)}
				<div class="file-group">
					{#if group.allSelected}
						<!-- 文件中所有测试都被选中，只显示文件路径 -->
						<div class="file-header-full">
							<span class="file-name">{group.file}</span>
							<span class="full-badge">全部 ({group.totalInFile})</span>
						</div>
					{:else}
						<!-- 部分测试被选中，显示文件路径和每个测试 -->
						<div class="file-header" onclick={() => toggleFileExpand(group.file)}>
							<button class="expand-btn">
								{expandedFiles.has(group.file) ? '▼' : '▶'}
							</button>
							<span class="file-name">{group.file}</span>
							<span class="partial-badge">{group.tests.length}/{group.totalInFile}</span>
						</div>
						{#if expandedFiles.has(group.file)}
							{#each group.tests as test (test)}
								<div class="test-item">
									<div class="test-title">{test.title}</div>
									<div class="test-location">
										行 {test.location.line}
									</div>
								</div>
							{/each}
						{/if}
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<!-- 可拖动的分隔条 -->
	<div class="horizontal-resizer" onmousedown={handleResizeStart} class:resizing={isResizing}></div>

	<!-- 文本显示区域 -->
	<div class="text-section" style="height: {textSectionHeight}px;">
		<div class="text-header">
			<span class="text-header-title">文本格式（换行符分隔）</span>
			<button class="download-btn" onclick={downloadTestList} disabled={selectedArray.length === 0}>
				<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
					<path d="M8.5 1a.5.5 0 0 0-1 0v8.793L5.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 9.793V1z"/>
					<path d="M3 14.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
				</svg>
				下载
			</button>
		</div>
		<textarea
			class="text-display"
			readonly
			placeholder="选中的测试将以文本格式显示在这里..."
		>{textDisplay}</textarea>
	</div>
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

	.selected-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		min-height: 0;
	}

	.file-group {
		margin-bottom: 12px;
	}

	.file-header {
		font-size: 11px;
		font-weight: 600;
		color: #007acc;
		padding: 4px 8px;
		background: #f0f8ff;
		border-left: 3px solid #007acc;
		margin-bottom: 4px;
		word-break: break-all;
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
		user-select: none;
	}

	.file-header:hover {
		background: #e6f3ff;
	}

	.expand-btn {
		width: 12px;
		height: 12px;
		padding: 0;
		margin: 0;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 8px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #007acc;
		flex-shrink: 0;
	}

	.file-name {
		flex: 1;
		min-width: 0;
		word-break: break-all;
	}

	.file-header-full {
		font-size: 11px;
		font-weight: 600;
		color: #28a745;
		padding: 6px 8px;
		background: #f0fff4;
		border-left: 3px solid #28a745;
		word-break: break-all;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}

	.full-badge {
		font-size: 10px;
		font-weight: 500;
		color: #28a745;
		background: #d4edda;
		padding: 2px 6px;
		border-radius: 10px;
		white-space: nowrap;
	}

	.partial-badge {
		font-size: 10px;
		font-weight: 500;
		color: #007acc;
		background: #cce5ff;
		padding: 2px 6px;
		border-radius: 10px;
		white-space: nowrap;
	}

	.test-item {
		padding: 4px 8px 4px 16px;
		margin-bottom: 2px;
		border-left: 2px solid #e0e0e0;
		background: #fafafa;
	}

	.test-item:hover {
		background: #f0f0f0;
	}

	.test-title {
		font-size: 12px;
		font-weight: 400;
		margin-bottom: 2px;
		color: #333;
	}

	.test-location {
		font-size: 10px;
		color: #666;
	}

	.empty-message {
		padding: 20px;
		text-align: center;
		color: #999;
		font-size: 12px;
	}

	.horizontal-resizer {
		height: 4px;
		background: #e0e0e0;
		cursor: row-resize;
		flex-shrink: 0;
		position: relative;
		transition: background 0.2s ease;
	}

	.horizontal-resizer:hover {
		background: #007acc;
	}

	.horizontal-resizer.resizing {
		background: #007acc;
	}

	.horizontal-resizer::before {
		content: '';
		position: absolute;
		top: -2px;
		left: 0;
		right: 0;
		bottom: -2px;
	}

	.text-section {
		padding: 8px;
		background: #fafafa;
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		overflow: hidden;
	}

	.text-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
		gap: 8px;
	}

	.text-header-title {
		font-size: 11px;
		font-weight: 600;
		color: #666;
	}

	.download-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		font-size: 11px;
		font-weight: 500;
		color: #fff;
		background: #007acc;
		border: none;
		border-radius: 3px;
		cursor: pointer;
		transition: background 0.2s ease;
		white-space: nowrap;
	}

	.download-btn:hover:not(:disabled) {
		background: #005a9e;
	}

	.download-btn:active:not(:disabled) {
		background: #004578;
	}

	.download-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.download-btn svg {
		flex-shrink: 0;
	}

	.text-display {
		flex: 1;
		width: 100%;
		padding: 6px;
		font-size: 11px;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		border: 1px solid #ccc;
		border-radius: 3px;
		background: #fff;
		resize: none;
		overflow-y: auto;
	}

	.text-display:focus {
		outline: none;
		border-color: #007acc;
	}
</style>
