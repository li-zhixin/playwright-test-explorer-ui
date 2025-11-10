import type { SuiteItem } from '$lib/types';

export interface LoadResult {
	success: boolean;
	data?: SuiteItem;
	fileName?: string;
	error?: string;
}

export interface FailedTestsResult {
	success: boolean;
	testIds?: Set<string>;
	fileName?: string;
	error?: string;
}

/**
 * 从 URL 加载测试数据
 */
export async function loadFromUrl(url: string): Promise<LoadResult> {
	try {
		const response = await fetch(url.trim());
		if (!response.ok) {
			return {
				success: false,
				error: `HTTP error! status: ${response.status}`
			};
		}
		const data = await response.json();
		return {
			success: true,
			data,
			fileName: url.trim()
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}

/**
 * 从本地文件加载测试数据
 */
export async function loadFromFile(file: File): Promise<LoadResult> {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const data = JSON.parse(content);
				resolve({
					success: true,
					data,
					fileName: file.name
				});
			} catch (error) {
				resolve({
					success: false,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		};
		reader.onerror = () => {
			resolve({
				success: false,
				error: 'Failed to read file'
			});
		};
		reader.readAsText(file);
	});
}

/**
 * 从本地文件加载失败测试列表
 */
export async function loadFailedTestsFromFile(file: File): Promise<FailedTestsResult> {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const data = JSON.parse(content);

				if (data.failedTests && Array.isArray(data.failedTests)) {
					resolve({
						success: true,
						testIds: new Set(data.failedTests),
						fileName: file.name
					});
				} else {
					resolve({
						success: false,
						error: 'JSON 格式不正确，需要包含 failedTests 数组'
					});
				}
			} catch (error) {
				resolve({
					success: false,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		};
		reader.onerror = () => {
			resolve({
				success: false,
				error: 'Failed to read file'
			});
		};
		reader.readAsText(file);
	});
}
