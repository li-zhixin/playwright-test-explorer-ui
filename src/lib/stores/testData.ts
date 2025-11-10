import { writable } from 'svelte/store';
import type { SuiteItem } from '$lib/types';

interface TestDataState {
	rootNode: SuiteItem | null;
	currentFile: string;
}

function createTestDataStore() {
	const { subscribe, set, update } = writable<TestDataState>({
		rootNode: null,
		currentFile: ''
	});

	return {
		subscribe,
		setRootNode: (rootNode: SuiteItem | null) => {
			update(state => ({ ...state, rootNode }));
		},
		setCurrentFile: (currentFile: string) => {
			update(state => ({ ...state, currentFile }));
		},
		setData: (rootNode: SuiteItem | null, currentFile: string) => {
			set({ rootNode, currentFile });
		},
		reset: () => {
			set({ rootNode: null, currentFile: '' });
		}
	};
}

export const testDataStore = createTestDataStore();
