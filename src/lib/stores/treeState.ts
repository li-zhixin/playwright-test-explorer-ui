import { writable } from 'svelte/store';
import type { TreeNode } from '$lib/types';

function createTreeStateStore() {
	const { subscribe, set, update } = writable<Set<TreeNode>>(new Set());

	return {
		subscribe,
		toggle: (node: TreeNode) => {
			update(current => {
				const newSet = new Set(current);
				if (newSet.has(node)) {
					newSet.delete(node);
				} else {
					newSet.add(node);
				}
				return newSet;
			});
		},
		expand: (node: TreeNode) => {
			update(current => {
				const newSet = new Set(current);
				newSet.add(node);
				return newSet;
			});
		},
		collapse: (node: TreeNode) => {
			update(current => {
				const newSet = new Set(current);
				newSet.delete(node);
				return newSet;
			});
		},
		expandAll: (nodes: TreeNode[]) => {
			update(current => {
				const newSet = new Set(current);
				nodes.forEach(node => newSet.add(node));
				return newSet;
			});
		},
		collapseAll: () => {
			set(new Set());
		},
		setExpanded: (nodes: Set<TreeNode>) => {
			set(nodes);
		}
	};
}

export const treeStateStore = createTreeStateStore();
