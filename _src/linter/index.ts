import { vscode } from "#deps";
import { tsParser } from "../core/fileManager/tsParser.js";
import { wxmlParser } from "../core/fileManager/wxmlParser.js";
import { validateWxmlData } from "../core/wxmlValidator/validateData.js";
import { debounce } from "../utils/debounce.js";
import { getComponentDir, getSiblingUri, isComponentUri, isTsFile, isWxmlFile } from "../utils/uriHelper.js";

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
    const debouncedCheck = debounce(this.#checkComponent, 200);
    this.#disposables.push(vscode.workspace.onDidChangeTextDocument(async (event) => {
      const uri = event.document.uri;
      if (event.contentChanges.length === 0) return;
      if (!isComponentUri(uri)) return;

      const text = event.document.getText();
      if (isTsFile(uri)) {
        tsParser.updateFromText(uri, text);
      } else if (isWxmlFile(uri)) {
        wxmlParser.updateFromText(uri, text);
      }
      debouncedCheck.call(this, uri);
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

  async #checkComponent(uri: vscode.Uri): Promise<void> {
    const dir = getComponentDir(uri);

    try {
      const tsUri = getSiblingUri(uri, ".ts");
      const wxmlUri = getSiblingUri(uri, ".wxml");

      const tsInfo = await tsParser.tsParse(tsUri);
      const wxmlInfo = await wxmlParser.parse(wxmlUri);

      // 当前只校验 WXML 中数据引用
      const diagnostics = validateWxmlData(
        wxmlInfo.text.split("\n"),
        wxmlInfo.wxmlDocument,
        tsInfo.rootComponentInfo,
      );

      this.#diagnosticCollection.set(wxmlUri, diagnostics);
    } catch {
      // 文件不存在等异常，跳过（不清空诊断，保留旧结果）
    } finally {
      // 无论成功失败都标记为已检查，避免重复触发
      this.#checkedDirs.add(dir);
    }
  }
}

export const linter = new Linter();
