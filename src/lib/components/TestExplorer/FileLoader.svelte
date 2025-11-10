<script lang="ts">
	import { testDataStore } from '$lib/stores/testData';
	import { selectionStore } from '$lib/stores/selection';
	import { loadFromUrl, loadFromFile } from '$lib/services/fileLoader';

	let fileInput = $state('');
	let fileInputElement: HTMLInputElement;

	async function handleLoadFromUrl() {
		if (!fileInput.trim()) return;

		const result = await loadFromUrl(fileInput);
		if (result.success && result.data) {
			testDataStore.setData(result.data, result.fileName || '');
			selectionStore.clear();
		} else {
			alert(`加载文件失败: ${result.error}`);
		}
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const result = await loadFromFile(file);
		if (result.success && result.data) {
			testDataStore.setData(result.data, result.fileName || '');
			selectionStore.clear();
		} else {
			alert(`解析文件失败: ${result.error}`);
		}
	}

	function openFileBrowser() {
		fileInputElement?.click();
	}
</script>

<input
	type="file"
	accept=".json"
	bind:this={fileInputElement}
	onchange={handleFileSelect}
	style="display: none;"
/>

<div class="file-section">
	<div class="file-input-group">
		<button class="btn-browse" onclick={openFileBrowser}>选择文件</button>
		<input
			type="text"
			class="file-input"
			bind:value={fileInput}
			placeholder="或输入文件路径/URL"
		/>
		<button class="btn-load" onclick={handleLoadFromUrl}>加载</button>
	</div>
</div>

<style>
	.file-section {
		padding: 8px 12px;
		border-bottom: 1px solid #e0e0e0;
		background: #fafafa;
	}

	.file-input-group {
		display: flex;
		gap: 4px;
	}

	.file-input {
		flex: 1;
		padding: 4px 8px;
		font-size: 12px;
		border: 1px solid #ccc;
		border-radius: 3px;
	}

	.btn-browse,
	.btn-load {
		padding: 4px 12px;
		font-size: 12px;
		border: 1px solid #ccc;
		border-radius: 3px;
		background: #fff;
		cursor: pointer;
		white-space: nowrap;
	}

	.btn-browse {
		background: #007acc;
		color: #fff;
		border-color: #007acc;
	}

	.btn-browse:hover {
		background: #005a9e;
		border-color: #005a9e;
	}

	.btn-load:hover {
		background: #f0f0f0;
	}
</style>
