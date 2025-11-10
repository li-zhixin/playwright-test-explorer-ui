<script lang="ts">
	import type { TestItem, TreeNode } from '$lib/types';
	import { getAllTestsInFile } from '$lib/utils/treeUtils';

	interface Props {
		groupedByFile: FileGroup[];
		expandedFiles: Set<string>;
		onToggleExpand: (file: string) => void;
	}

	interface FileGroup {
		file: string;
		tests: TestItem[];
		allSelected: boolean;
		totalInFile: number;
	}

	let { groupedByFile, expandedFiles, onToggleExpand }: Props = $props();
</script>

<div class="selected-list">
	{#if groupedByFile.length === 0}
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
					<div class="file-header" onclick={() => onToggleExpand(group.file)}>
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
								<div class="test-location">行 {test.location.line}</div>
							</div>
						{/each}
					{/if}
				{/if}
			</div>
		{/each}
	{/if}
</div>

<style>
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
</style>
