<script lang="ts">
	import type { TestNode, TestItem } from '$lib/types';

	interface Props {
		node: TestNode;
		level?: number;
		selectedTests: Set<TestItem>;
		expandedNodes: Set<TestNode>;
		onToggleExpand: (node: TestNode) => void;
		onToggleCheck: (node: TestNode) => void;
		getCheckState: (node: TestNode) => { checked: boolean; indeterminate: boolean };
		filterText?: string;
	}

	let {
		node,
		level = 0,
		selectedTests,
		expandedNodes,
		onToggleExpand,
		onToggleCheck,
		getCheckState,
		filterText = ''
	}: Props = $props();

	const isExpanded = $derived(expandedNodes.has(node));
	const checkState = $derived(getCheckState(node));
	const isSuite = $derived(node.type === 'suite');

	// 检查节点是否匹配过滤条件
	function matchesFilter(node: TestNode, filter: string): boolean {
		if (!filter) return true;
		const lowerFilter = filter.toLowerCase();

		if (node.type === 'test') {
			return (
				node.title.toLowerCase().includes(lowerFilter) ||
				node.location.file.toLowerCase().includes(lowerFilter)
			);
		} else {
			// 套件节点：检查自身或任何子节点是否匹配
			if (node.title.toLowerCase().includes(lowerFilter)) return true;
			if (node.file && node.file.toLowerCase().includes(lowerFilter)) return true;
			return node.children.some((child) => matchesFilter(child, filter));
		}
	}

	const shouldShow = $derived(matchesFilter(node, filterText));

	// 获取可见的子节点
	const visibleChildren = $derived(
		node.type === 'suite'
			? node.children.filter((child) => matchesFilter(child, filterText))
			: []
	);
</script>

{#if shouldShow}
	<div class="tree-node" style="padding-left: {level * 6}px">
		<div class="node-content">
			<!-- 展开/折叠按钮 -->
			{#if isSuite && node.type === 'suite' && node.children.length > 0}
				<button
					class="expand-btn"
					onclick={() => onToggleExpand(node)}
					aria-label={isExpanded ? '折叠' : '展开'}
				>
					{isExpanded ? '▼' : '▶'}
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
				{#if isSuite}
					📁
				{:else}
					📄
				{/if}
			</span>

			<!-- 标题和位置信息 -->
			<div class="node-info">
				<span class="node-title">{node.title}</span>
				{#if node.type === 'test'}
					<span class="node-location">
						{node.location.file}:{node.location.line}
					</span>
				{/if}
			</div>
		</div>

		<!-- 子节点 -->
		{#if isSuite && isExpanded && visibleChildren.length > 0}
			{#each visibleChildren as child (child)}
				<svelte:self
					node={child}
					level={level + 1}
					{selectedTests}
					{expandedNodes}
					{onToggleExpand}
					{onToggleCheck}
					{getCheckState}
					{filterText}
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
