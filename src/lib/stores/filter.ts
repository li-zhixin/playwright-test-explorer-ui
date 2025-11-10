import { writable } from 'svelte/store';

interface FilterState {
	filterText: string;
	failedTestIds: Set<string>;
	failedTestsFile: string;
}

function createFilterStore() {
	const { subscribe, set, update } = writable<FilterState>({
		filterText: '',
		failedTestIds: new Set(),
		failedTestsFile: ''
	});

	return {
		subscribe,
		setFilterText: (text: string) => {
			update(state => ({ ...state, filterText: text }));
		},
		setFailedTests: (testIds: Set<string>, fileName: string) => {
			update(state => ({
				...state,
				failedTestIds: testIds,
				failedTestsFile: fileName
			}));
		},
		clearFailedTests: () => {
			update(state => ({
				...state,
				failedTestIds: new Set(),
				failedTestsFile: ''
			}));
		},
		reset: () => {
			set({
				filterText: '',
				failedTestIds: new Set(),
				failedTestsFile: ''
			});
		}
	};
}

export const filterStore = createFilterStore();
