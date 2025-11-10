import type { TreeNode, TestItem } from '$lib/types';

/**
 * 检查节点是否匹配过滤条件
 * @param node 要检查的节点
 * @param filterText 文本过滤条件
 * @param failedTestIds 失败测试 ID 集合（如果存在，优先使用此过滤）
 * @returns 是否匹配
 */
export function matchesFilter(
	node: TreeNode,
	filterText: string,
	failedTestIds?: Set<string>
): boolean {
	// 如果有 failedTestIds 过滤，优先使用它
	if (failedTestIds && failedTestIds.size > 0) {
		return matchesFailedTestFilter(node, failedTestIds);
	}

	// 否则使用文本过滤
	return matchesTextFilter(node, filterText);
}

/**
 * 检查节点是否匹配失败测试过滤
 */
function matchesFailedTestFilter(node: TreeNode, failedTestIds: Set<string>): boolean {
	if (node.type === 'test') {
		return failedTestIds.has(node.testId);
	} else if (node.type === 'folder' || node.type === 'suite') {
		return node.children.some((child) => matchesFailedTestFilter(child, failedTestIds));
	}
	return false;
}

/**
 * 检查节点是否匹配文本过滤
 */
function matchesTextFilter(node: TreeNode, filter: string): boolean {
	if (!filter) return true;
	const lowerFilter = filter.toLowerCase();

	if (node.type === 'test') {
		return (
			node.title.toLowerCase().includes(lowerFilter) ||
			node.location.file.toLowerCase().includes(lowerFilter)
		);
	} else if (node.type === 'folder') {
		if (node.name.toLowerCase().includes(lowerFilter)) return true;
		if (node.path.toLowerCase().includes(lowerFilter)) return true;
		return node.children.some((child) => matchesTextFilter(child, filter));
	} else if (node.type === 'suite') {
		if (node.title.toLowerCase().includes(lowerFilter)) return true;
		if (node.file && node.file.toLowerCase().includes(lowerFilter)) return true;
		return node.children.some((child) => matchesTextFilter(child, filter));
	}
	return false;
}

/**
 * 获取所有匹配过滤条件的测试
 */
export function getVisibleTests(
	node: TreeNode,
	filterText: string,
	failedTestIds?: Set<string>
): TestItem[] {
	if (node.type === 'test') {
		return matchesFilter(node, filterText, failedTestIds) ? [node] : [];
	} else if (node.type === 'folder' || node.type === 'suite') {
		return node.children.flatMap((child) => getVisibleTests(child, filterText, failedTestIds));
	}
	return [];
}

/**
 * 展开所有包含匹配项的父节点
 * @returns 是否找到匹配项
 */
export function expandMatchingParents(
	node: TreeNode,
	filterText: string,
	failedTestIds: Set<string> | undefined,
	expanded: Set<TreeNode>
): boolean {
	if (node.type === 'test') {
		return matchesFilter(node, filterText, failedTestIds);
	}

	let hasMatch = false;

	// 如果没有 failedTestIds 过滤，检查节点自身
	if (!failedTestIds || failedTestIds.size === 0) {
		if (node.type === 'folder') {
			hasMatch =
				node.name.toLowerCase().includes(filterText.toLowerCase()) ||
				node.path.toLowerCase().includes(filterText.toLowerCase());
		} else if (node.type === 'suite') {
			hasMatch = node.title.toLowerCase().includes(filterText.toLowerCase());
			if (node.file && node.file.toLowerCase().includes(filterText.toLowerCase())) {
				hasMatch = true;
			}
		}
	}

	// 检查子节点
	if (node.type === 'folder' || node.type === 'suite') {
		for (const child of node.children) {
			if (expandMatchingParents(child, filterText, failedTestIds, expanded)) {
				hasMatch = true;
			}
		}
	}

	if (hasMatch) {
		expanded.add(node);
	}

	return hasMatch;
}
