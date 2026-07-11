import { vscode } from "#deps";
import { configuration } from "../configuration/index.js";
import { jsonParser } from "../core/fileManager/jsonParser.js";
import { tsParser } from "../core/fileManager/tsParser.js";
import { wxmlParser } from "../core/fileManager/wxmlParser.js";
// import { validateJson } from "../core/jsonValidator/index.js";
import { validateWxmlData } from "../core/wxmlValidator/validateData.js";
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
  #disposables: vscode.Disposable[] = [];

  /**
   * 测试钩子 — 仅在测试环境中使用
   * 生产打包后 esbuild 会 tree-shake 掉引用了 `__test__` 的测试代码
   */
  public __test__?: {
    skippedNonComponent: string[];
    skippedCheckedDir: string[];
  };

  public init(context: vscode.ExtensionContext): void {
    // 注册诊断集合，确保在插件停用时清理
    context.subscriptions.push(this.#diagnosticCollection);

    this.#onDidOpenTextDocument();
    this.#onDidChangeTextDocument();
    this.#onDidDeleteFiles();
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
    this.#disposables.push(vscode.workspace.onDidChangeTextDocument(async (event) => {
      const uri = event.document.uri;
      if (event.contentChanges.length === 0) return;
      if (!this.#guardCheck(uri)) return;

      // 仅更新变更文件对应 parser 的缓存，不触发全量重新解析
      const text = event.document.getText();
      if (isTsFile(uri)) {
        tsParser.updateFromText(uri, text);
      } else if (isWxmlFile(uri)) {
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
        const dir = getComponentDir(uri);
        this.#checkedDirs.delete(dir);
        this.#diagnosticCollection.delete(uri);
        tsParser.invalidate(uri.fsPath);
        wxmlParser.invalidate(uri.fsPath);
        jsonParser.invalidate(uri.fsPath);
      }
    }));
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
    void jsonInfo;
    // 合并所有合法数据名：RootComponent + SubComponents + 用户配置
    const validNames = new Set(tsInfo.rootComponentInfo.dataList);
    for (const subInfo of Object.values(tsInfo.subComponentInfoRecord)) {
      if (!subInfo) continue;
      for (const attrValue of Object.values(subInfo.configInfo)) {
        if (attrValue.type === "Root" || attrValue.type === "Self") {
          validNames.add(attrValue.value);
        }
      }
    }
    for (const name of configuration.validDatas) {
      validNames.add(name);
    }

    // WXML 数据引用诊断
    const wxmlDiagnostics = validateWxmlData(
      wxmlInfo.text.split("\n"),
      wxmlInfo.wxmlDocument,
      validNames,
    );

    this.#diagnosticCollection.set(wxmlUri, wxmlDiagnostics);
    // this.#diagnosticCollection.set(jsonUri, jsonDiagnostics);
  }

  // ---------- 组件检查入口（首次打开）----------

  /**
   * 首次打开组件文件时：解析所有文件 → 运行诊断 → 标记已检查
   */
  async #checkComponent(uri: vscode.Uri): Promise<void> {
    const dir = getComponentDir(uri);

    try {
      await this.#fetchComponentInfo(uri);
      this.#diagnoseComponent(uri);
    } catch {
      // 文件不存在等异常，跳过（不清空诊断，保留旧结果）
    } finally {
      // 无论成功失败都标记为已检查，避免重复触发
      this.#checkedDirs.add(dir);
    }
  }
}

export const linter = new Linter();
