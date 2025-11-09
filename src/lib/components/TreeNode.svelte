<script lang="ts">
	import type { TestNode, TestItem, TreeNode } from "$lib/types";
	import Self from "./TreeNode.svelte";

	interface Props {
		node: TreeNode;
		level?: number;
		selectedTests: Set<TestItem>;
		expandedNodes: Set<TreeNode>;
		onToggleExpand: (node: TreeNode) => void;
		onToggleCheck: (node: TreeNode) => void;
		getCheckState: (
			node: TreeNode,
		) => { checked: boolean; indeterminate: boolean };
		filterText?: string;
		failedTestIds?: Set<string>;
	}

	let {
		node,
		level = 0,
		selectedTests,
		expandedNodes,
		onToggleExpand,
		onToggleCheck,
		getCheckState,
		filterText = "",
		failedTestIds = new Set(),
	}: Props = $props();

	const isExpanded = $derived(expandedNodes.has(node));
	const checkState = $derived(getCheckState(node));
	const isSuite = $derived(node.type === "suite");
	const isFolder = $derived(node.type === "folder");

	// 从完整路径中提取文件名
	function getFileName(fullPath: string): string {
		const normalized = fullPath.replace(/\\/g, "/");
		const parts = normalized.split("/");
		return parts[parts.length - 1];
	}

	// 检查节点是否匹配过滤条件
	function matchesFilter(node: TreeNode, filter: string): boolean {
		// 如果有 failedTestIds 过滤，优先使用它
		if (failedTestIds.size > 0) {
			if (node.type === "test") {
				// 测试节点：检查 testId 是否在 failedTestIds 中
				return failedTestIds.has(node.testId);
			} else if (node.type === "folder" || node.type === "suite") {
				// 容器节点：检查是否有任何子节点匹配
				return node.children.some((child) => matchesFilter(child, filter));
			}
			return false;
		}

		// 否则使用文本过滤
		if (!filter) return true;
		const lowerFilter = filter.toLowerCase();

		if (node.type === "test") {
			return (
				node.title.toLowerCase().includes(lowerFilter) ||
				node.location.file.toLowerCase().includes(lowerFilter)
			);
		} else if (node.type === "folder") {
			// 文件夹节点：检查名称、路径或任何子节点是否匹配
			if (node.name.toLowerCase().includes(lowerFilter)) return true;
			if (node.path.toLowerCase().includes(lowerFilter)) return true;
			return node.children.some((child) => matchesFilter(child, filter));
		} else {
			// 套件节点：检查自身或任何子节点是否匹配
			if (node.title.toLowerCase().includes(lowerFilter)) return true;
			if (node.file && node.file.toLowerCase().includes(lowerFilter))
				return true;
			return node.children.some((child) => matchesFilter(child, filter));
		}
	}

	const shouldShow = $derived(matchesFilter(node, filterText));

	// 获取可见的子节点
	const visibleChildren = $derived(
		node.type === "suite" || node.type === "folder"
			? node.children.filter((child) => matchesFilter(child, filterText))
			: [],
	);
</script>

{#if shouldShow}
	<div class="tree-node" style="padding-left: {level * 6}px">
		<div class="node-content">
			<!-- 展开/折叠按钮 -->
			{#if (isSuite || isFolder) && ((node.type === "suite" && node.children.length > 0) || (node.type === "folder" && node.children.length > 0))}
				<button
					class="expand-btn"
					onclick={() => onToggleExpand(node)}
					aria-label={isExpanded ? "折叠" : "展开"}
				>
					{isExpanded ? "▼" : "▶"}
				</button>
			{:else}
				<span class="expand-placeholder"></span>
			{/if}

			<!-- Checkbox -->
			<input
				type="checkbox"
				class="node-checkbox"
				checked={checkState.checked}
				indeterminate={checkState.indeterminate}
				onchange={() => onToggleCheck(node)}
			/>

			<!-- 图标 -->
			<span class="node-icon">
				{#if isFolder}
					📁
				{:else if isSuite}
					{#if node.type === "suite" && node.file}
						📄
					{:else}
						📦
					{/if}
				{:else}
					📄
				{/if}
			</span>

			<!-- 标题和位置信息 -->
			<div class="node-info">
				<span class="node-title">
					{#if node.type === "folder"}
						{node.name}
					{:else if node.type === "suite"}
						{#if node.file && node.title === node.file}
							<!-- 文件级别的 suite，显示文件名 -->
							{getFileName(node.file)}
						{:else}
							<!-- 嵌套的 suite 或没有 file 的 suite，显示 title -->
							{node.title}
						{/if}
					{:else}
						{node.title}
					{/if}
				</span>
				{#if node.type === "test"}
					<span class="node-location">
						{node.location.file}:{node.location.line}
					</span>
				{/if}
			</div>
		</div>

		<!-- 子节点 -->
		{#if (isSuite || isFolder) && isExpanded && visibleChildren.length > 0}
			{#each visibleChildren as child (child)}
				<Self
					node={child}
					level={level + 1}
					{selectedTests}
					{expandedNodes}
					{onToggleExpand}
					{onToggleCheck}
					{getCheckState}
					{filterText}
					{failedTestIds}
				/>
			{/each}
		{/if}
	</div>
{/if}

<style>
	.tree-node {
		font-size: 12px;
	}

	.node-content {
		display: flex;
		align-items: center;
		min-height: 18px;
		padding: 0;
		gap: 3px;
	}

	.expand-btn {
		width: 10px;
		height: 10px;
		padding: 0;
		margin: 0 2px 0 0;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 8px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
	}

	.expand-btn:hover {
		color: #000;
	}

	.expand-placeholder {
		width: 10px;
		height: 10px;
		margin: 0 2px 0 0;
	}

	.node-checkbox {
		width: 13px;
		height: 13px;
		margin: 0;
		cursor: pointer;
	}

	.node-icon {
		font-size: 10px;
		line-height: 1;
	}

	.node-info {
		display: flex;
		flex-direction: column;
		gap: 1px;
		flex: 1;
		min-width: 0;
	}

	.node-title {
		font-size: 12px;
		line-height: 1.3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.node-location {
		font-size: 10px;
		color: #666;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
