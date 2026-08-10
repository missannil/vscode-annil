import { vscode } from "#deps";
import { configuration } from "../configuration/index.js";
import { jsonParser } from "../core/fileManager/jsonParser.js";
import { tsParser } from "../core/fileManager/tsParser.js";
import { type WxmlFileInfo, wxmlParser } from "../core/fileManager/wxmlParser.js";
import { validateJson } from "../core/jsonValidator/index.js";
import {
  collectExternalComponentInfo,
  type TraverseAstResult,
} from "../core/tsAnalyzer/collectExternalSubComponentSources.js";
import { resolveImportedSubComponentPaths } from "../core/tsAnalyzer/resolveImportedSubComponentPaths.js";
import { diagnoseUnusedData } from "../core/tsAnalyzer/unusedDataAnalyzer.js";
import type { JsonFileInfo } from "../core/types/JsonFileInfo.js";
import { checkWxml } from "../core/wxmlValidator/wxmlChecker.js";
import { debounce } from "../utils/debounce.js";
import { nonNullable } from "../utils/nonNullable.js";
import {
  getComponentDir,
  getSiblingUri,
  isComponentUri,
  isJsonFile,
  isTsFile,
  isWxmlFile,
} from "../utils/uriHelper.js";

/**
 * Linter 核心：监听组件文件变化，驱动解析 → 校验 → 诊断输出
 */
class Linter {
  #diagnosticCollection = vscode.languages.createDiagnosticCollection("annil");
  #checkedDirs = new Set<string>();
  #dependencyToComponents = new Map<string, Set<string>>();
  #disposables: vscode.Disposable[] = [];

  /**
   * 测试钩子 — 仅在测试环境中使用
   * 生产打包后 esbuild 会 tree-shake 掉引用了 `__test__` 的测试代码
   */
  public __test__?: {
    skippedNonComponent: string[];
    skippedCheckedDir: string[];
  };

  /** 测试专用：直接执行守卫逻辑，不依赖 VS Code 文档打开事件。 */
  public __testGuardCheck(uri: vscode.Uri): boolean {
    return this.#guardCheck(uri);
  }

  /** 测试专用：清理已检查目录，避免测试用例相互污染。 */
  public __testClearCheckedDirs(): void {
    this.#checkedDirs.clear();
  }

  /** 测试专用：模拟组件首次检测完成后的目录记录。 */
  public __testMarkCheckedDir(uri: vscode.Uri): void {
    this.#checkedDirs.add(getComponentDir(uri));
  }

  public init(context: vscode.ExtensionContext): void {
    // 注册诊断集合，确保在插件停用时清理
    context.subscriptions.push(this.#diagnosticCollection);

    this.#onDidOpenTextDocument();
    this.#onDidChangeTextDocument();
    this.#onDidDeleteFiles();
    this.#onDidCreateFiles();
    this.#onDidRenameFiles();
    void this.#checkVisibleEditors();
  }

  /** 释放所有事件监听，避免宿主关闭时报 Channel has been closed */
  public dispose(): void {
    for (const d of this.#disposables) d.dispose();
    this.#disposables = [];
    this.#diagnosticCollection.dispose();
  }

  // ---------- 事件监听 ----------

  #onDidOpenTextDocument(): void {
    this.#disposables.push(vscode.workspace.onDidOpenTextDocument(async (doc) => {
      if (!this.#guardCheck(doc.uri)) return;
      await this.#checkComponent(doc.uri);
    }));
  }

  #onDidChangeTextDocument(): void {
    const debouncedDiagnose = debounce(this.#diagnoseComponent, 200);
    const debouncedRefresh = debounce(this.#refreshDependentComponents, 200);
    this.#disposables.push(vscode.workspace.onDidChangeTextDocument(async (event) => {
      const uri = event.document.uri;
      if (event.contentChanges.length === 0) return;
      if (isTsFile(uri)) {
        tsParser.updateFromText(uri, event.document.getText());
        const dependents = this.#dependencyToComponents.get(uri.fsPath);
        if (dependents !== undefined && dependents.size > 0) {
          debouncedRefresh.call(this, uri.fsPath);
        }

        if (!isComponentUri(uri)) return;
      }
      if (!isComponentUri(uri)) {
        this.__test__?.skippedNonComponent.push(uri.fsPath);

        return;
      }

      // 仅更新变更文件对应 parser 的缓存，不触发全量重新解析
      const text = event.document.getText();
      if (isWxmlFile(uri)) {
        wxmlParser.updateFromText(uri, text);
      } else if (isJsonFile(uri) === true) {
        jsonParser.updateFromText(uri, text);
      }
      // 直接用缓存数据运行诊断，不对其他两个兄弟文件做重新解析
      debouncedDiagnose.call(this, uri);
    }));
  }

  #onDidDeleteFiles(): void {
    this.#disposables.push(vscode.workspace.onDidDeleteFiles((event) => {
      for (const uri of event.files) {
        this.#invalidateComponent(uri);
      }
    }));
  }

  #onDidCreateFiles(): void {
    this.#disposables.push(vscode.workspace.onDidCreateFiles((event) => {
      for (const uri of event.files) this.#refreshComponent(uri);
    }));
  }

  #onDidRenameFiles(): void {
    this.#disposables.push(vscode.workspace.onDidRenameFiles((event) => {
      for (const { oldUri, newUri } of event.files) {
        this.#invalidateComponent(oldUri);
        this.#refreshComponent(newUri);
      }
    }));
  }

  #invalidateComponent(uri: vscode.Uri): void {
    const dir = getComponentDir(uri);
    this.#checkedDirs.delete(dir);
    this.#removeComponentDependencies(getSiblingUri(uri, ".ts").fsPath);

    for (
      const sibling of [
        getSiblingUri(uri, ".ts"),
        getSiblingUri(uri, ".json"),
        getSiblingUri(uri, ".wxml"),
      ]
    ) {
      this.#diagnosticCollection.delete(sibling);
      tsParser.invalidate(sibling.fsPath);
      wxmlParser.invalidate(sibling.fsPath);
      jsonParser.invalidate(sibling.fsPath);
    }
  }

  #refreshComponent(uri: vscode.Uri): void {
    if (!isComponentUri(uri)) return;
    void this.#checkComponent(uri);
  }

  async #checkVisibleEditors(): Promise<void> {
    for (const editor of vscode.window.visibleTextEditors) {
      if (!this.#guardCheck(editor.document.uri)) continue;
      await this.#checkComponent(editor.document.uri);
    }
  }

  // ---------- 守卫逻辑 ----------

  /** 返回 true 表示通过守卫，应继续检查 */
  #guardCheck(uri: vscode.Uri): boolean {
    if (!isComponentUri(uri)) {
      this.__test__?.skippedNonComponent.push(uri.fsPath);

      return false;
    }
    const dir = getComponentDir(uri);
    if (this.#checkedDirs.has(dir)) {
      this.__test__?.skippedCheckedDir.push(uri.fsPath);

      return false;
    }

    return true;
  }

  // ---------- 组件信息获取 ----------

  /**
   * 首次打开组件时，确保三个文件（.ts / .json / .wxml）都已被解析并缓存
   * 已有缓存的跳过，不重复读盘
   */
  async #fetchComponentInfo(uri: vscode.Uri): Promise<void> {
    const tsUri = getSiblingUri(uri, ".ts");
    const jsonUri = getSiblingUri(uri, ".json");
    const wxmlUri = getSiblingUri(uri, ".wxml");

    // tsParse / parse 内部有缓存检查：命中缓存直接返回，未命中则从磁盘读取并解析
    await tsParser.tsParse(tsUri);
    await jsonParser.parse(jsonUri);
    await wxmlParser.parse(wxmlUri);
  }

  // ---------- 诊断输出 ----------

  /**
   * 从各 parser 缓存中取数据，运行 WXML + JSON 诊断并输出
   *
   * 调用方需保证三个文件的缓存均已就绪：
   * - 首次打开：由 #fetchComponentInfo 先填充
   * - 文件变更：在 #onDidChangeTextDocument 中已通过 updateFromText 更新对应缓存
   */
  #diagnoseComponent(uri: vscode.Uri): void {
    const tsUri = getSiblingUri(uri, ".ts");
    const jsonUri = getSiblingUri(uri, ".json");
    const wxmlUri = getSiblingUri(uri, ".wxml");

    const tsInfo = nonNullable(tsParser.getCached(tsUri.fsPath));
    const jsonInfo = nonNullable(jsonParser.getCached(jsonUri.fsPath));
    const wxmlInfo = nonNullable(wxmlParser.getCached(wxmlUri.fsPath));

    void this.#diagnoseWithExternalSubComponents(tsUri, jsonUri, wxmlUri, tsInfo, jsonInfo, wxmlInfo);
  }

  /** 外部 TS 文件变化时，只重新检查依赖它的主组件。 */
  async #refreshDependentComponents(changedFsPath: string): Promise<void> {
    const dependents = [...(this.#dependencyToComponents.get(changedFsPath) ?? [])];

    for (const mainTsPath of dependents) {
      this.#checkedDirs.delete(getComponentDir(vscode.Uri.file(mainTsPath)));
      await this.#checkComponent(vscode.Uri.file(mainTsPath));
    }
  }

  #removeComponentDependencies(mainTsPath: string): void {
    for (const [dependency, components] of this.#dependencyToComponents) {
      components.delete(mainTsPath);
      if (components.size === 0) this.#dependencyToComponents.delete(dependency);
    }
  }

  #updateComponentDependencies(mainTsPath: string, dependencies: readonly string[]): void {
    this.#removeComponentDependencies(mainTsPath);
    for (const dependency of dependencies) {
      const components = this.#dependencyToComponents.get(dependency) ?? new Set<string>();
      components.add(mainTsPath);
      this.#dependencyToComponents.set(dependency, components);
    }
  }

  /** 合并外部文件定义的子组件来源后运行 JSON + WXML 诊断。 */
  async #diagnoseWithExternalSubComponents(
    tsUri: vscode.Uri,
    jsonUri: vscode.Uri,
    wxmlUri: vscode.Uri,
    tsInfo: TraverseAstResult,
    jsonInfo: JsonFileInfo,
    wxmlInfo: WxmlFileInfo,
  ): Promise<void> {
    const parseFile = (fsPath: string): Promise<TraverseAstResult> => tsParser.tsParse(vscode.Uri.file(fsPath));
    const externalComponentInfo = await collectExternalComponentInfo(tsUri.fsPath, tsInfo, parseFile);
    this.#updateComponentDependencies(tsUri.fsPath, externalComponentInfo.dependencies);
    const importedSubCompInfo = resolveImportedSubComponentPaths(
      tsUri.fsPath,
      externalComponentInfo.importedSubComponentSourceRecord,
    );
    const effectiveTsInfo: TraverseAstResult = {
      ...tsInfo,
      customComponentInfoRecord: externalComponentInfo.customComponentInfoRecord,
      chunkComponentInfoRecord: externalComponentInfo.chunkComponentInfoRecord,
    };
    const tsText = (await vscode.workspace.openTextDocument(tsUri)).getText();
    const externalTexts = await Promise.all(
      externalComponentInfo.dependencies.map(async (fsPath) => {
        return (await vscode.workspace.openTextDocument(vscode.Uri.file(fsPath))).getText();
      }),
    );
    const wxmlUsedNames = new Set<string>();

    // WXML 诊断统一由校验入口编排，Linter 不感知具体规则。
    const wxmlDiagnostics = checkWxml(
      wxmlInfo.text,
      wxmlInfo.wxmlDocument,
      effectiveTsInfo,
      configuration.validDatas,
      wxmlUsedNames,
    );
    const tsDiagnostics = diagnoseUnusedData(
      tsText,
      configuration.innerDataPrefix,
      wxmlUsedNames,
      externalTexts,
    );
    const jsonDiagnostics = validateJson(jsonInfo, importedSubCompInfo, jsonUri.fsPath);

    this.#diagnosticCollection.set(tsUri, tsDiagnostics);
    this.#diagnosticCollection.set(wxmlUri, wxmlDiagnostics);
    this.#diagnosticCollection.set(jsonUri, jsonDiagnostics);
  }

  // ---------- 组件检查入口（首次打开）----------

  /**
   * 首次打开组件文件时：解析所有文件 → 运行诊断 → 标记已检查
   */
  async #checkComponent(uri: vscode.Uri): Promise<void> {
    const dir = getComponentDir(uri);

    let checked = false;
    try {
      await this.#fetchComponentInfo(uri);
      this.#diagnoseComponent(uri);
      checked = true;
    } catch {
      // 文件不存在或解析失败时不标记目录，待文件恢复后允许重新检查。
    }
    if (checked) {
      this.#checkedDirs.add(dir);
    }
  }
}

export const linter = new Linter();
