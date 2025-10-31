<script lang="ts">
	import type { TestItem, TestNode, SuiteItem } from '$lib/types';

	interface Props {
		selectedTests: Set<TestItem>;
		rootNode: SuiteItem | null;
	}

	let { selectedTests, rootNode }: Props = $props();

	const selectedArray = $derived(Array.from(selectedTests));
	
	// 跟踪每个文件的展开状态
	let expandedFiles = $state<Set<string>>(new Set());

	// 获取文件中所有测试用例
	function getAllTestsInFile(node: TestNode, targetFile: string): TestItem[] {
		if (node.type === 'test') {
			return node.location.file === targetFile ? [node] : [];
		} else {
			return node.children.flatMap(child => getAllTestsInFile(child, targetFile));
		}
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

	// 生成文本显示（空格分隔）
	const textDisplay = $derived.by(() => {
		const result: string[] = [];
		
		groupedByFile.forEach(group => {
			if (group.allSelected) {
				// 文件全选，只显示文件路径
				result.push(group.file);
			} else {
				// 部分选中，显示每个测试的文件:行号
				group.tests.forEach(test => {
					result.push(`${test.location.file}:${test.location.line}`);
				});
			}
		});
		
		return result.join(' ');
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
</script>

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

	<!-- 文本显示区域 -->
	<div class="text-section">
		<div class="text-header">文本格式（空格分隔）</div>
		<textarea
			class="text-display"
			readonly
			placeholder="选中的测试将以文本格式显示在这里..."
		>{textDisplay}</textarea>
	</div>
</div>

<style>
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

	.text-section {
		border-top: 2px solid #e0e0e0;
		padding: 8px;
		background: #fafafa;
		display: flex;
		flex-direction: column;
		min-height: 120px;
		max-height: 200px;
	}

	.text-header {
		font-size: 11px;
		font-weight: 600;
		color: #666;
		margin-bottom: 4px;
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
		resize: vertical;
		min-height: 80px;
	}

	.text-display:focus {
		outline: none;
		border-color: #007acc;
	}
</style>
