import type { TreeNode, TestItem } from '$lib/types';

/**
 * 获取节点下的所有测试
 */
export function getAllTests(node: TreeNode): TestItem[] {
	if (node.type === 'test') {
		return [node];
	} else if (node.type === 'folder' || node.type === 'suite') {
		return node.children.flatMap((child) => getAllTests(child));
	}
	return [];
}

/**
 * 收集所有 suite 和 folder 节点
 */
export function collectAllContainerNodes(node: TreeNode, result: Set<TreeNode>) {
	if (node.type === 'suite' || node.type === 'folder') {
		result.add(node);
		node.children.forEach((child) => collectAllContainerNodes(child, result));
	}
}

/**
 * 获取文件中的所有测试
 */
export function getAllTestsInFile(node: TreeNode, targetFile: string): TestItem[] {
	if (node.type === 'test') {
		return node.location.file === targetFile ? [node] : [];
	} else if (node.type === 'suite' || node.type === 'folder') {
		return node.children.flatMap((child) => getAllTestsInFile(child, targetFile));
	}
	return [];
}

/**
 * 在树中查找测试并构建其完整路径
 * @returns 路径数组（例如：["file.spec.ts", "describe block", "test name"]）
 */
export function findTestPath(node: TreeNode, targetTest: TestItem, currentPath: string[]): string[] {
	if (node.type === 'test') {
		if (node === targetTest || node.testId === targetTest.testId) {
			return [...currentPath, node.title];
		}
		return [];
	}

	if (node.type === 'suite') {
		let newPath: string[];

		if (node.file) {
			const hasFilePath = currentPath.length > 0 && currentPath[0].includes('/');

			if (hasFilePath) {
				// 已经有文件路径了，这是嵌套的 suite
				newPath = [...currentPath, node.title];
			} else {
				// 这是文件级别的 suite，使用文件路径作为起点
				newPath = [node.file];
			}
		} else {
			// 没有 file 属性的 suite（如 Root, chromium 等）
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

/**
 * 从完整路径中提取文件名
 */
export function getFileName(fullPath: string): string {
	const normalized = fullPath.replace(/\\/g, '/');
	const parts = normalized.split('/');
	return parts[parts.length - 1];
}
