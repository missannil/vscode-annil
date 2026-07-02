import { vscode } from "#deps";
import { configuration } from "../../configuration/index.js";
import { traverseAst, type TraverseAstResult } from "../tsAnalyzer/index.js";
import { FileCache } from "./fileCache.js";

/**
 * TS 文件解析器
 * 读取 TS 文件 → AST 遍历 → 组件配置信息
 */
class TsParser {
  #cache = new FileCache<TraverseAstResult>();

  /**
   * 解析 TS 文件，返回组件信息
   */
  public async parse(uri: vscode.Uri): Promise<TraverseAstResult> {
    const fsPath = uri.fsPath;
    const cached = this.#cache.get(fsPath);
    if (cached !== undefined) return cached;

    const text = (await vscode.workspace.openTextDocument(uri)).getText();
    const result = traverseAst(fsPath, text, configuration.innerDataPrefix);
    this.#cache.set(fsPath, result);

    return result;
  }

  /** 更新缓存（文件变更时调用） */
  public updateFromText(uri: vscode.Uri, text: string): TraverseAstResult {
    const result = traverseAst(uri.fsPath, text, configuration.innerDataPrefix);
    this.#cache.set(uri.fsPath, result);

    return result;
  }

  /** 获取缓存（不解析） */
  public getCached(fsPath: string): TraverseAstResult | undefined {
    return this.#cache.get(fsPath);
  }

  public invalidate(fsPath: string): void {
    this.#cache.invalidate(fsPath);
  }
}

export const tsParser = new TsParser();
