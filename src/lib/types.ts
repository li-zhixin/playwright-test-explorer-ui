export interface TestItem {
	type: 'test';
	title: string;
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
	children: TestNode[];
}

export type TestNode = TestItem | SuiteItem;

export interface TreeNodeState {
	expanded: boolean;
	checked: boolean;
	indeterminate: boolean;
}
