import { vscode } from "#deps";
import { tsParser } from "../core/fileManager/tsParser.js";
import { wxmlParser } from "../core/fileManager/wxmlParser.js";
import { validateWxmlData } from "../core/wxmlValidator/validateData.js";
import { debounce } from "../utils/debounce.js";

/**
 * Linter 核心：监听组件文件变化，驱动解析 → 校验 → 诊断输出
 */
class Linter {
  #diagnosticCollection = vscode.languages.createDiagnosticCollection("annil");
  #checkedDirs = new Set<string>();

  public init(context: vscode.ExtensionContext): void {
    // 注册诊断集合，确保在插件停用时清理
    context.subscriptions.push(this.#diagnosticCollection);

    this.#onDidOpenTextDocument();
    this.#onDidChangeTextDocument();
    this.#onDidDeleteFiles();
    void this.#checkVisibleEditors();
  }

  // ---------- 事件监听 ----------

  #onDidOpenTextDocument(): void {
    vscode.workspace.onDidOpenTextDocument(async (doc) => {
      if (!isComponentFile(doc.uri)) return;
      const dir = getComponentDir(doc.uri);
      if (this.#checkedDirs.has(dir)) return;
      await this.#checkComponent(doc.uri);
    });
  }

  #onDidChangeTextDocument(): void {
    const debouncedCheck = debounce(this.#checkComponent, 200);
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      const uri = event.document.uri;
      if (event.contentChanges.length === 0) return;
      if (!isComponentFile(uri)) return;

      const text = event.document.getText();
      if (isTsFile(uri)) {
        tsParser.updateFromText(uri, text);
      } else if (isWxmlFile(uri)) {
        wxmlParser.updateFromText(uri, text);
      }
      debouncedCheck.call(this, uri);
    });
  }

  #onDidDeleteFiles(): void {
    vscode.workspace.onDidDeleteFiles((event) => {
      for (const uri of event.files) {
        const dir = getComponentDir(uri);
        this.#checkedDirs.delete(dir);
        this.#diagnosticCollection.delete(uri);
        tsParser.invalidate(uri.fsPath);
        wxmlParser.invalidate(uri.fsPath);
      }
    });
  }

  async #checkVisibleEditors(): Promise<void> {
    for (const editor of vscode.window.visibleTextEditors) {
      const uri = editor.document.uri;
      if (!isComponentFile(uri)) continue;
      const dir = getComponentDir(uri);
      if (this.#checkedDirs.has(dir)) continue;
      await this.#checkComponent(uri);
    }
  }

  // ---------- 核心检测 ----------

  async #checkComponent(uri: vscode.Uri): Promise<void> {
    const dir = getComponentDir(uri);

    try {
      const tsUri = getSiblingUri(uri, ".ts");
      const wxmlUri = getSiblingUri(uri, ".wxml");

      const tsInfo = await tsParser.parse(tsUri);
      const wxmlInfo = await wxmlParser.parse(wxmlUri);

      // 当前只校验 WXML 中数据引用
      const diagnostics = validateWxmlData(
        wxmlInfo.text.split("\n"),
        wxmlInfo.wxmlDocument,
        tsInfo.rootComponentInfo,
      );

      this.#diagnosticCollection.set(wxmlUri, diagnostics);
      this.#checkedDirs.add(dir);
    } catch {
      // 文件不存在等异常，跳过
    }
  }
}

// ---------- 工具函数 ----------

function isTsFile(uri: vscode.Uri): boolean {
  return uri.fsPath.endsWith(".ts") || uri.fsPath.endsWith(".js");
}

function isWxmlFile(uri: vscode.Uri): boolean {
  return uri.fsPath.endsWith(".wxml");
}

function isComponentFile(uri: vscode.Uri): boolean {
  return isTsFile(uri) || isWxmlFile(uri)
    || uri.fsPath.endsWith(".json");
}

function getComponentDir(uri: vscode.Uri): string {
  return uri.fsPath.split("/").slice(0, -1).join("/");
}

function getSiblingUri(uri: vscode.Uri, extension: string): vscode.Uri {
  const fsPath = uri.fsPath.replace(/\.[^.]+$/, "") + extension;

  return vscode.Uri.file(fsPath);
}

export const linter = new Linter();
