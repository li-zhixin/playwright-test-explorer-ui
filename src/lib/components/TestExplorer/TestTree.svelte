<script lang="ts">
	import TreeNodeComponent from '../TreeNode.svelte';
	import { testDataStore } from '$lib/stores/testData';
	import { selectionStore } from '$lib/stores/selection';
	import { filterStore } from '$lib/stores/filter';
	import { treeStateStore } from '$lib/stores/treeState';
	import { buildFolderTree } from '$lib/utils/treeBuilder';
	import { expandMatchingParents } from '$lib/utils/filterUtils';
	import { getCheckState, toggleNodeSelection } from '$lib/utils/selectionUtils';
	import { collectAllContainerNodes } from '$lib/utils/treeUtils';
	import type { TreeNode } from '$lib/types';

	// 构建显示树
	const displayTree = $derived(buildFolderTree($testDataStore.rootNode));

	// 初始化时展开第一层
	$effect(() => {
		if (displayTree && displayTree.children) {
			const initialNodes = [displayTree, ...displayTree.children];
			treeStateStore.setExpanded(new Set(initialNodes));
		}
	});

	// 当过滤条件改变时，自动展开匹配的节点
	$effect(() => {
		const hasFilter = $filterStore.filterText || $filterStore.failedTestIds.size > 0;
		if (hasFilter && displayTree) {
			const newExpanded = new Set<TreeNode>();
			expandMatchingParents(
				displayTree,
				$filterStore.filterText,
				$filterStore.failedTestIds,
				newExpanded
			);
			treeStateStore.setExpanded(newExpanded);
		}
	});

	function handleToggleExpand(node: TreeNode) {
		treeStateStore.toggle(node);
	}

	function handleToggleCheck(node: TreeNode) {
		const newSelection = toggleNodeSelection(
			node,
			$selectionStore,
			$filterStore.filterText,
			$filterStore.failedTestIds
		);
		selectionStore.setSelection(newSelection);
	}

	function handleGetCheckState(node: TreeNode) {
		return getCheckState(
			node,
			$selectionStore,
			$filterStore.filterText,
			$filterStore.failedTestIds
		);
	}
</script>

<div class="tree-container">
	{#if displayTree}
		{#if displayTree.children && displayTree.children.length > 0}
			{#each displayTree.children as child (child)}
				<TreeNodeComponent
					node={child}
					selectedTests={$selectionStore}
					expandedNodes={$treeStateStore}
					onToggleExpand={handleToggleExpand}
					onToggleCheck={handleToggleCheck}
					getCheckState={handleGetCheckState}
					filterText={$filterStore.filterText}
					failedTestIds={$filterStore.failedTestIds}
				/>
			{/each}
		{:else}
			<div class="empty-message">没有找到测试用例</div>
		{/if}
	{:else}
		<div class="empty-message">请加载测试数据文件</div>
	{/if}
</div>

<style>
	.tree-container {
		flex: 1;
		overflow-y: auto;
		padding: 2px;
	}

	.empty-message {
		padding: 20px;
		text-align: center;
		color: #999;
		font-size: 12px;
	}
</style>
