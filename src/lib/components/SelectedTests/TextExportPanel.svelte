<script lang="ts">
	interface Props {
		textDisplay: string;
		disabled: boolean;
		height: number;
		onDownload: () => void;
		onResizeStart: (e: MouseEvent) => void;
		isResizing: boolean;
	}

	let { textDisplay, disabled, height, onDownload, onResizeStart, isResizing }: Props = $props();
</script>

<div class="horizontal-resizer" onmousedown={onResizeStart} class:resizing={isResizing}></div>

<div class="text-section" style="height: {height}px;">
	<div class="text-header">
		<span class="text-header-title">文本格式（换行符分隔）</span>
		<button class="download-btn" onclick={onDownload} {disabled}>
			<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
				<path
					d="M8.5 1a.5.5 0 0 0-1 0v8.793L5.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 9.793V1z"
				/>
				<path d="M3 14.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z" />
			</svg>
			下载
		</button>
	</div>
	<textarea
		class="text-display"
		readonly
		placeholder="选中的测试将以文本格式显示在这里..."
	>{textDisplay}</textarea>
</div>

<style>
	.horizontal-resizer {
		height: 4px;
		background: #e0e0e0;
		cursor: row-resize;
		flex-shrink: 0;
		position: relative;
		transition: background 0.2s ease;
	}

	.horizontal-resizer:hover {
		background: #007acc;
	}

	.horizontal-resizer.resizing {
		background: #007acc;
	}

	.horizontal-resizer::before {
		content: '';
		position: absolute;
		top: -2px;
		left: 0;
		right: 0;
		bottom: -2px;
	}

	.text-section {
		padding: 8px;
		background: #fafafa;
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		overflow: hidden;
	}

	.text-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
		gap: 8px;
	}

	.text-header-title {
		font-size: 11px;
		font-weight: 600;
		color: #666;
	}

	.download-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		font-size: 11px;
		font-weight: 500;
		color: #fff;
		background: #007acc;
		border: none;
		border-radius: 3px;
		cursor: pointer;
		transition: background 0.2s ease;
		white-space: nowrap;
	}

	.download-btn:hover:not(:disabled) {
		background: #005a9e;
	}

	.download-btn:active:not(:disabled) {
		background: #004578;
	}

	.download-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.download-btn svg {
		flex-shrink: 0;
	}

	.text-display {
		flex: 1;
		width: 100%;
		padding: 6px;
		font-size: 11px;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		border: 1px solid #ccc;
		border-radius: 3px;
		background: #fff;
		resize: none;
		overflow-y: auto;
	}

	.text-display:focus {
		outline: none;
		border-color: #007acc;
	}
</style>
