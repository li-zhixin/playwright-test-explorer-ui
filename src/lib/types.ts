export interface TestItem {
	type: 'test';
	title: string;
	testId: string;
	location: {
		file: string;
		line: number;
		column: number;
	};
	tags: string[];
	annotations: any[];
	expectedStatus: string;
	timeout: number;
}

export interface SuiteItem {
	type: 'suite';
	title: string;
	file?: string;
	children: TreeNode[];
}

export interface FolderItem {
	type: 'folder';
	path: string;
	name: string;
	children: TreeNode[];
}

export type TestNode = TestItem | SuiteItem;
export type TreeNode = TestNode | FolderItem;

export interface TreeNodeState {
	expanded: boolean;
	checked: boolean;
	indeterminate: boolean;
}
