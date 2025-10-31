<script lang="ts">
  import TreeNode from "./TreeNode.svelte";
  import type { TestNode, TestItem, SuiteItem } from "$lib/types";

  interface Props {
    rootNode: SuiteItem | null;
    selectedTests: Set<TestItem>;
    onSelectionChange: (tests: Set<TestItem>) => void;
    currentFile: string;
    onFileChange: (file: string) => void;
  }

  let {
    rootNode = $bindable(),
    selectedTests = $bindable(),
    onSelectionChange,
    currentFile,
    onFileChange,
  }: Props = $props();

  let filterText = $state("");
  let expandedNodes = $state<Set<TestNode>>(new Set());
  let fileInput = $state("");
  let fileInputElement: HTMLInputElement;

  // 初始化时展开第一层
  $effect(() => {
    if (rootNode && rootNode.children) {
      expandedNodes = new Set([rootNode, ...rootNode.children]);
    }
  });

  // 当过滤文本改变时，自动展开包含匹配项的节点
  $effect(() => {
    if (filterText && rootNode) {
      const newExpanded = new Set<TestNode>();
      expandAllMatchingParents(rootNode, filterText, newExpanded);
      expandedNodes = newExpanded;
    }
  });

  function expandAllMatchingParents(
    node: TestNode,
    filter: string,
    expanded: Set<TestNode>,
  ): boolean {
    if (node.type === "test") {
      const matches =
        node.title.toLowerCase().includes(filter.toLowerCase()) ||
        node.location.file.toLowerCase().includes(filter.toLowerCase());
      return matches;
    } else {
      let hasMatch = node.title.toLowerCase().includes(filter.toLowerCase());
      if (node.file && node.file.toLowerCase().includes(filter.toLowerCase())) {
        hasMatch = true;
      }

      for (const child of node.children) {
        if (expandAllMatchingParents(child, filter, expanded)) {
          hasMatch = true;
        }
      }

      if (hasMatch) {
        expanded.add(node);
      }
      return hasMatch;
    }
  }

  function toggleExpand(node: TestNode) {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(node)) {
      newExpanded.delete(node);
    } else {
      newExpanded.add(node);
    }
    expandedNodes = newExpanded;
  }

  function expandAll() {
    if (!rootNode) return;
    const allNodes = new Set<TestNode>();
    collectAllSuites(rootNode, allNodes);
    expandedNodes = allNodes;
  }

  function collapseAll() {
    expandedNodes = new Set();
  }

  function collectAllSuites(node: TestNode, result: Set<TestNode>) {
    if (node.type === "suite") {
      result.add(node);
      node.children.forEach((child) => collectAllSuites(child, result));
    }
  }

  function toggleCheck(node: TestNode) {
    const newSelected = new Set(selectedTests);
    // 使用可见的测试（考虑过滤条件）
    const allTests = getVisibleTests(node, filterText);

    // 检查当前状态
    const allChecked = allTests.every((test) => newSelected.has(test));

    if (allChecked) {
      // 取消选中所有
      allTests.forEach((test) => newSelected.delete(test));
    } else {
      // 选中所有
      allTests.forEach((test) => newSelected.add(test));
    }

    onSelectionChange(newSelected);
  }

  function getAllTests(node: TestNode): TestItem[] {
    if (node.type === "test") {
      return [node];
    } else {
      return node.children.flatMap((child) => getAllTests(child));
    }
  }

  // 获取匹配过滤条件的可见测试
  function getVisibleTests(node: TestNode, filter: string): TestItem[] {
    if (node.type === "test") {
      return matchesFilter(node, filter) ? [node] : [];
    } else {
      return node.children.flatMap((child) => getVisibleTests(child, filter));
    }
  }

  // 检查节点是否匹配过滤条件
  function matchesFilter(node: TestNode, filter: string): boolean {
    if (!filter) return true;
    const lowerFilter = filter.toLowerCase();

    if (node.type === "test") {
      return (
        node.title.toLowerCase().includes(lowerFilter) ||
        node.location.file.toLowerCase().includes(lowerFilter)
      );
    } else {
      // 套件节点：检查自身或任何子节点是否匹配
      if (node.title.toLowerCase().includes(lowerFilter)) return true;
      if (node.file && node.file.toLowerCase().includes(lowerFilter)) {
        return true;
      }
      return node.children.some((child) => matchesFilter(child, filter));
    }
  }

  function getCheckState(node: TestNode): {
    checked: boolean;
    indeterminate: boolean;
  } {
    // 使用可见的测试（考虑过滤条件）
    const allTests = getVisibleTests(node, filterText);
    const checkedCount = allTests.filter((test) =>
      selectedTests.has(test),
    ).length;

    if (checkedCount === 0) {
      return { checked: false, indeterminate: false };
    } else if (checkedCount === allTests.length) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  }

  function selectAll() {
    if (!rootNode) return;
    const allTests = getAllTests(rootNode);
    onSelectionChange(new Set(allTests));
  }

  function deselectAll() {
    onSelectionChange(new Set());
  }

  async function loadFile() {
    if (!fileInput.trim()) return;

    try {
      const response = await fetch(fileInput.trim());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      rootNode = data;
      onFileChange(fileInput.trim());
      onSelectionChange(new Set()); // 清空选择
    } catch (error) {
      alert(
        `加载文件失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        rootNode = data;
        onFileChange(file.name);
        onSelectionChange(new Set()); // 清空选择
      } catch (error) {
        alert(
          `解析文件失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };
    reader.readAsText(file);
  }

  function openFileBrowser() {
    fileInputElement?.click();
  }
</script>

<div class="test-explorer">
  <div class="explorer-header">
    <h2 class="explorer-title">Test Explorer</h2>
  </div>

  <!-- 隐藏的文件输入 -->
  <input
    type="file"
    accept=".json"
    bind:this={fileInputElement}
    onchange={handleFileSelect}
    style="display: none;"
  />

  <!-- 文件选择区域 -->
  <div class="file-section">
    <div class="file-input-group">
      <button class="btn-browse" onclick={openFileBrowser}>选择文件</button>
      <input
        type="text"
        class="file-input"
        bind:value={fileInput}
        placeholder="或输入文件路径/URL"
      />
      <button class="btn-load" onclick={loadFile}>加载</button>
    </div>
    {#if currentFile}
      <div class="current-file">当前文件: {currentFile}</div>
    {/if}
  </div>

  <!-- 工具栏 -->
  <div class="toolbar">
    <input
      type="text"
      class="filter-input"
      bind:value={filterText}
      placeholder="过滤测试..."
    />
  </div>

  <!-- 树形结构 -->
  <div class="tree-container">
    {#if rootNode}
      {#if rootNode.children && rootNode.children.length > 0}
        {#each rootNode.children as child (child)}
          <TreeNode
            node={child}
            {selectedTests}
            {expandedNodes}
            onToggleExpand={toggleExpand}
            onToggleCheck={toggleCheck}
            {getCheckState}
            {filterText}
          />
        {/each}
      {:else}
        <div class="empty-message">没有找到测试用例</div>
      {/if}
    {:else}
      <div class="empty-message">请加载测试数据文件</div>
    {/if}
  </div>
</div>

<style>
  .test-explorer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    border-right: 1px solid #e0e0e0;
  }

  .explorer-header {
    padding: 8px 12px;
    border-bottom: 1px solid #e0e0e0;
    background: #f5f5f5;
  }

  .explorer-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .file-section {
    padding: 8px 12px;
    border-bottom: 1px solid #e0e0e0;
    background: #fafafa;
  }

  .file-input-group {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
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

  .current-file {
    font-size: 10px;
    color: #666;
    margin-top: 4px;
  }

  .toolbar {
    padding: 6px 12px;
    border-bottom: 1px solid #e0e0e0;
    background: #fafafa;
  }

  .filter-input {
    width: 100%;
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid #ccc;
    border-radius: 3px;
  }

  .tree-container {
    flex: 1;
    overflow-y: auto;
    padding: 2px;
  }

  .empty-message {
    padding: 20px;
    text-align: center;
    color: #999;
    font-size: 12px;
  }
</style>
