<script lang="ts">
  import TreeNodeComponent from "./TreeNode.svelte";
  import type { TestNode, TestItem, SuiteItem, TreeNode } from "$lib/types";
  import { buildFolderTree } from "$lib/utils/treeBuilder";

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
  let expandedNodes = $state<Set<TreeNode>>(new Set());
  let fileInput = $state("");
  let fileInputElement: HTMLInputElement;
  let failedTestsInputElement: HTMLInputElement;
  let failedTestIds = $state<Set<string>>(new Set());
  let failedTestsFile = $state("");

  // 将原始树转换为带文件夹层级的树
  const displayTree = $derived(buildFolderTree(rootNode));

  // 初始化时展开第一层
  $effect(() => {
    if (displayTree && displayTree.children) {
      expandedNodes = new Set([displayTree, ...displayTree.children]);
    }
  });

  // 当过滤文本或 failedTestIds 改变时，自动展开包含匹配项的节点
  $effect(() => {
    if ((filterText || failedTestIds.size > 0) && displayTree) {
      const newExpanded = new Set<TreeNode>();
      expandAllMatchingParents(displayTree, filterText, newExpanded);
      expandedNodes = newExpanded;
    }
  });

  function expandAllMatchingParents(
    node: TreeNode,
    filter: string,
    expanded: Set<TreeNode>,
  ): boolean {
    if (node.type === "test") {
      // 如果有 failedTestIds 过滤，检查 testId
      if (failedTestIds.size > 0) {
        return failedTestIds.has(node.testId);
      }
      // 否则使用文本过滤
      const matches =
        node.title.toLowerCase().includes(filter.toLowerCase()) ||
        node.location.file.toLowerCase().includes(filter.toLowerCase());
      return matches;
    } else if (node.type === "folder") {
      let hasMatch = false;

      // 如果没有 failedTestIds 过滤，检查文件夹名称
      if (failedTestIds.size === 0) {
        hasMatch = node.name.toLowerCase().includes(filter.toLowerCase()) ||
                   node.path.toLowerCase().includes(filter.toLowerCase());
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
    } else {
      let hasMatch = false;

      // 如果没有 failedTestIds 过滤，检查套件名称
      if (failedTestIds.size === 0) {
        hasMatch = node.title.toLowerCase().includes(filter.toLowerCase());
        if (node.file && node.file.toLowerCase().includes(filter.toLowerCase())) {
          hasMatch = true;
        }
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

  function toggleExpand(node: TreeNode) {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(node)) {
      newExpanded.delete(node);
    } else {
      newExpanded.add(node);
    }
    expandedNodes = newExpanded;
  }

  function expandAll() {
    if (!displayTree) return;
    const allNodes = new Set<TreeNode>();
    collectAllSuites(displayTree, allNodes);
    expandedNodes = allNodes;
  }

  function collapseAll() {
    expandedNodes = new Set();
  }

  function collectAllSuites(node: TreeNode, result: Set<TreeNode>) {
    if (node.type === "suite" || node.type === "folder") {
      result.add(node);
      node.children.forEach((child) => collectAllSuites(child, result));
    }
  }

  function toggleCheck(node: TreeNode) {
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

  function getAllTests(node: TreeNode): TestItem[] {
    if (node.type === "test") {
      return [node];
    } else if (node.type === "folder" || node.type === "suite") {
      return node.children.flatMap((child) => getAllTests(child));
    }
    return [];
  }

  // 获取匹配过滤条件的可见测试
  function getVisibleTests(node: TreeNode, filter: string): TestItem[] {
    if (node.type === "test") {
      return matchesFilter(node, filter) ? [node] : [];
    } else if (node.type === "folder" || node.type === "suite") {
      return node.children.flatMap((child) => getVisibleTests(child, filter));
    }
    return [];
  }

  // 检查节点是否匹配过滤条件
  function matchesFilter(node: TreeNode, filter: string): boolean {
    // 如果有 failedTestIds 过滤，优先使用它
    if (failedTestIds.size > 0) {
      if (node.type === "test") {
        // 测试节点：检查 testId 是否在 failedTestIds 中
        return failedTestIds.has(node.testId);
      } else if (node.type === "folder" || node.type === "suite") {
        // 容器节点：检查是否有任何子节点匹配
        return node.children.some((child) => matchesFilter(child, filter));
      }
      return false;
    }

    // 否则使用文本过滤
    if (!filter) return true;
    const lowerFilter = filter.toLowerCase();

    if (node.type === "test") {
      return (
        node.title.toLowerCase().includes(lowerFilter) ||
        node.location.file.toLowerCase().includes(lowerFilter)
      );
    } else if (node.type === "folder") {
      // 文件夹节点：检查路径或名称是否匹配
      if (node.name.toLowerCase().includes(lowerFilter)) return true;
      if (node.path.toLowerCase().includes(lowerFilter)) return true;
      return node.children.some((child) => matchesFilter(child, filter));
    } else if (node.type === "suite") {
      // 套件节点：检查自身或任何子节点是否匹配
      if (node.title.toLowerCase().includes(lowerFilter)) return true;
      if (node.file && node.file.toLowerCase().includes(lowerFilter)) {
        return true;
      }
      return node.children.some((child) => matchesFilter(child, filter));
    }
    return false;
  }

  function getCheckState(node: TreeNode): {
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
    if (!displayTree) return;
    const allTests = getAllTests(displayTree);
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

  function openFailedTestsBrowser() {
    failedTestsInputElement?.click();
  }

  function handleFailedTestsSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.failedTests && Array.isArray(data.failedTests)) {
          failedTestIds = new Set(data.failedTests);
          failedTestsFile = file.name;

          // 自动选中所有匹配的失败测试
          if (displayTree) {
            const allTests = getAllTests(displayTree);
            const matchedTests = allTests.filter(test => failedTestIds.has(test.testId));
            onSelectionChange(new Set(matchedTests));
          }
        } else {
          alert('JSON 格式不正确，需要包含 failedTests 数组');
        }
      } catch (error) {
        alert(
          `解析文件失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };
    reader.readAsText(file);
  }

  function clearFailedTestsFilter() {
    failedTestIds = new Set();
    failedTestsFile = "";
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
  <input
    type="file"
    accept=".json"
    bind:this={failedTestsInputElement}
    onchange={handleFailedTestsSelect}
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

  <!-- Failed Tests 过滤区域 -->
  <div class="filter-section">
    <div class="filter-header">
      <span class="filter-label">Failed Tests 过滤:</span>
      <button class="btn-filter" onclick={openFailedTestsBrowser}>
        选择过滤文件
      </button>
    </div>
    {#if failedTestsFile}
      <div class="filter-status">
        <span class="filter-file">
          已加载: {failedTestsFile} ({failedTestIds.size} 个失败测试)
        </span>
        <button class="btn-clear-filter" onclick={clearFailedTestsFilter}>
          清除过滤
        </button>
      </div>
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
    {#if displayTree}
      {#if displayTree.children && displayTree.children.length > 0}
        {#each displayTree.children as child (child)}
          <TreeNodeComponent
            node={child}
            {selectedTests}
            {expandedNodes}
            onToggleExpand={toggleExpand}
            onToggleCheck={toggleCheck}
            {getCheckState}
            {filterText}
            {failedTestIds}
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

  .filter-section {
    padding: 8px 12px;
    border-bottom: 1px solid #e0e0e0;
    background: #fff8e6;
  }

  .filter-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-label {
    font-size: 11px;
    font-weight: 600;
    color: #333;
  }

  .btn-filter {
    padding: 4px 12px;
    font-size: 11px;
    border: 1px solid #ff9800;
    border-radius: 3px;
    background: #ff9800;
    color: #fff;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-filter:hover {
    background: #f57c00;
    border-color: #f57c00;
  }

  .filter-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    font-size: 10px;
  }

  .filter-file {
    flex: 1;
    color: #555;
    background: #fff;
    padding: 3px 6px;
    border-radius: 2px;
    border: 1px solid #ffc107;
  }

  .btn-clear-filter {
    padding: 3px 10px;
    font-size: 10px;
    border: 1px solid #ccc;
    border-radius: 3px;
    background: #fff;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-clear-filter:hover {
    background: #f0f0f0;
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
