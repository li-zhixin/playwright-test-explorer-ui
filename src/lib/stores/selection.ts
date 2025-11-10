import { writable } from 'svelte/store';
import type { TestItem } from '$lib/types';

function createSelectionStore() {
	const { subscribe, set, update } = writable<Set<TestItem>>(new Set());

	return {
		subscribe,
		setSelection: (tests: Set<TestItem>) => {
			set(tests);
		},
		addTest: (test: TestItem) => {
			update(current => {
				const newSet = new Set(current);
				newSet.add(test);
				return newSet;
			});
		},
		removeTest: (test: TestItem) => {
			update(current => {
				const newSet = new Set(current);
				newSet.delete(test);
				return newSet;
			});
		},
		toggleTest: (test: TestItem) => {
			update(current => {
				const newSet = new Set(current);
				if (newSet.has(test)) {
					newSet.delete(test);
				} else {
					newSet.add(test);
				}
				return newSet;
			});
		},
		addTests: (tests: TestItem[]) => {
			update(current => {
				const newSet = new Set(current);
				tests.forEach(test => newSet.add(test));
				return newSet;
			});
		},
		removeTests: (tests: TestItem[]) => {
			update(current => {
				const newSet = new Set(current);
				tests.forEach(test => newSet.delete(test));
				return newSet;
			});
		},
		clear: () => {
			set(new Set());
		}
	};
}

export const selectionStore = createSelectionStore();
