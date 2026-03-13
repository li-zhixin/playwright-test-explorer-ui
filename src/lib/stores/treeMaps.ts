import { derived } from 'svelte/store';
import { testDataStore } from './testData';
import { buildFolderTree, buildTreeMaps, type TreeMaps } from '$lib/utils/treeBuilder';

const emptyMaps: TreeMaps = {
	nodeTestsMap: new Map(),
	testItemMap: new Map(),
	testPathMap: new Map()
};

/**
 * 从 testDataStore.rootNode 派生的预计算查找表。
 * 仅在 rootNode 变化时重新计算（加载新数据时）。
 */
export const treeMapsStore = derived(testDataStore, ($testData) => {
	if (!$testData.rootNode) return emptyMaps;
	const folderTree = buildFolderTree($testData.rootNode);
	if (!folderTree) return emptyMaps;
	return buildTreeMaps(folderTree);
});
