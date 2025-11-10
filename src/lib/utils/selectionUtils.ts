import type { TreeNode, TestItem } from '$lib/types';
import { getVisibleTests } from './filterUtils';

/**
 * 获取节点的选中状态
 */
export function getCheckState(
	node: TreeNode,
	selectedTests: Set<TestItem>,
	filterText: string,
	failedTestIds?: Set<string>
): { checked: boolean; indeterminate: boolean } {
	const visibleTests = getVisibleTests(node, filterText, failedTestIds);
	const checkedCount = visibleTests.filter((test) => selectedTests.has(test)).length;

	if (checkedCount === 0) {
		return { checked: false, indeterminate: false };
	} else if (checkedCount === visibleTests.length) {
		return { checked: true, indeterminate: false };
	} else {
		return { checked: false, indeterminate: true };
	}
}

/**
 * 切换节点的选中状态
 * @returns 新的选中集合
 */
export function toggleNodeSelection(
	node: TreeNode,
	currentSelection: Set<TestItem>,
	filterText: string,
	failedTestIds?: Set<string>
): Set<TestItem> {
	const newSelected = new Set(currentSelection);
	const visibleTests = getVisibleTests(node, filterText, failedTestIds);

	// 检查当前状态
	const allChecked = visibleTests.every((test) => newSelected.has(test));

	if (allChecked) {
		// 取消选中所有
		visibleTests.forEach((test) => newSelected.delete(test));
	} else {
		// 选中所有
		visibleTests.forEach((test) => newSelected.add(test));
	}

	return newSelected;
}
