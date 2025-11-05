import type { TestNode, TreeNode, FolderItem, SuiteItem, TestItem } from '$lib/types';

/**
 * 将测试树转换为带文件夹层级的树结构
 * 保留原有的 Suite 层级，但按照文件路径组织
 */
export function buildFolderTree(rootNode: SuiteItem | null): SuiteItem | null {
	if (!rootNode) return null;

	// 创建新的根节点
	const newRoot: SuiteItem = {
		type: 'suite',
		title: rootNode.title,
		file: rootNode.file,
		children: []
	};

	// 按文件路径收集节点（保留完整的 Suite 结构）
	const nodesByPath = new Map<string, TreeNode[]>();
	collectNodesByPath(rootNode, nodesByPath);

	// 构建文件夹树
	const folderTree = createFolderStructure(nodesByPath);

	// 将文件夹树作为根节点的子节点
	newRoot.children = folderTree;

	return newRoot;
}

/**
 * 递归收集节点，按文件路径分组
 * 保留 Suite 层级结构，但跳过顶层的容器 Suite（如 Root、chromium）
 */
function collectNodesByPath(node: TestNode, nodesByPath: Map<string, TreeNode[]>) {
	if (node.type === 'suite') {
		// 对于每个子节点，递归处理
		for (const child of node.children) {
			if (child.type === 'suite') {
				// 检查这个 suite 是否有关联的文件
				if (child.file) {
					// 有文件关联，这是一个文件级别的 suite
					const filePath = child.file;
					if (!nodesByPath.has(filePath)) {
						nodesByPath.set(filePath, []);
					}
					nodesByPath.get(filePath)!.push(child);
				} else {
					// 没有文件关联，这是一个容器 suite（如 Root、chromium），递归处理
					collectNodesByPath(child, nodesByPath);
				}
			} else if (child.type === 'test') {
				// 直接的测试项
				const filePath = child.location.file;
				if (!nodesByPath.has(filePath)) {
					nodesByPath.set(filePath, []);
				}
				nodesByPath.get(filePath)!.push(child);
			}
		}
	}
}

/**
 * 获取节点下的所有测试项
 */
function getAllTestsFromNode(node: TreeNode): TestItem[] {
	if (node.type === 'test') {
		return [node];
	} else if (node.type === 'suite' || node.type === 'folder') {
		return node.children.flatMap((child) => getAllTestsFromNode(child));
	}
	return [];
}

/**
 * 过滤 Suite，只保留指定文件的测试
 */
function filterSuiteByFile(suite: SuiteItem, targetFile: string): SuiteItem | null {
	const filteredChildren: TestNode[] = [];

	for (const child of suite.children) {
		if (child.type === 'test') {
			if (child.location.file === targetFile) {
				filteredChildren.push(child);
			}
		} else if (child.type === 'suite') {
			const filtered = filterSuiteByFile(child, targetFile);
			if (filtered && filtered.children.length > 0) {
				filteredChildren.push(filtered);
			}
		}
	}

	// 如果没有子节点，返回 null
	if (filteredChildren.length === 0) {
		return null;
	}

	return {
		type: 'suite',
		title: suite.title,
		file: suite.file,
		children: filteredChildren
	};
}

/**
 * 创建文件夹层级结构
 */
function createFolderStructure(nodesByPath: Map<string, TreeNode[]>): TreeNode[] {
	// 用于存储文件夹结构的 Map
	const folderMap = new Map<string, FolderItem>();

	// 遍历所有文件路径
	for (const [filePath, nodes] of nodesByPath.entries()) {
		// 标准化路径分隔符（统一使用 /）
		const normalizedPath = filePath.replace(/\\/g, '/');
		const parts = normalizedPath.split('/');

		// 为每个路径部分创建文件夹节点（不包括文件名）
		let currentPath = '';
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			const parentPath = currentPath;
			currentPath = currentPath ? `${currentPath}/${part}` : part;

			// 如果文件夹不存在，创建它
			if (!folderMap.has(currentPath)) {
				const folder: FolderItem = {
					type: 'folder',
					path: currentPath,
					name: part,
					children: []
				};
				folderMap.set(currentPath, folder);

				// 将文件夹添加到父文件夹的子节点中
				if (parentPath && folderMap.has(parentPath)) {
					const parentFolder = folderMap.get(parentPath);
					if (parentFolder) {
						// 检查是否已经添加过
						if (!parentFolder.children.includes(folder)) {
							parentFolder.children.push(folder);
						}
					}
				}
			}
		}

		// 直接将节点添加到对应的文件夹中（不创建额外的文件节点）
		const folderPath = parts.slice(0, -1).join('/');
		if (folderPath && folderMap.has(folderPath)) {
			const folder = folderMap.get(folderPath)!;
			folder.children.push(...nodes);
		} else if (!folderPath) {
			// 如果没有文件夹路径，说明文件在根目录
			// 这种情况下需要特殊处理，暂存起来
			if (!folderMap.has('__root__')) {
				folderMap.set('__root__', {
					type: 'folder',
					path: '__root__',
					name: '__root__',
					children: []
				});
			}
			folderMap.get('__root__')!.children.push(...nodes);
		}
	}

	// 获取根级别的文件夹（没有父文件夹的）
	const rootFolders: TreeNode[] = [];
	const allPaths = Array.from(folderMap.keys());
	const rootPaths = allPaths.filter((path) => !path.includes('/') && path !== '__root__');

	for (const path of rootPaths) {
		const folder = folderMap.get(path)!;
		rootFolders.push(folder);
	}

	// 处理根目录的文件（没有文件夹的）
	if (folderMap.has('__root__')) {
		const rootFiles = folderMap.get('__root__')!.children;
		rootFolders.push(...rootFiles);
	}

	return rootFolders;
}
