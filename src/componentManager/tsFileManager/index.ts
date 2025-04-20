import * as vscode from "vscode";
import type { TsUri } from "../uriHelper";
import { getSubComponentInfos } from "./getExternalSubComponentInfos";
import { mergeComponentInfos } from "./mergeComponentInfos";
import { traverseAst } from "./traverseAst";
import type { ComponentInfo, FileInfo, TsFileFsPath } from "./types";

/**
 * TS文件解析管理类
 */
class TsFile {
  /**
   * 缓存已解析的文件信息
   */
  private infoCache: Record<TsFileFsPath, ComponentInfo | undefined> = {};

  /**
   * 获取组件信息
   * @param fileInfo 已知的文件信息
   * @param tsUri 文件URI
   * @returns ComponentInfo
   */
  public generateComponentInfo(tsUri: TsUri, fileInfo: FileInfo): ComponentInfo {
    const mainPath = tsUri.fsPath;
    // 获取主文件的信息
    const mainComponentInfo = traverseAst(mainPath, fileInfo);
    const { importedVariables, subComponentNames } = mainComponentInfo;
    // 获取子组件的信息
    const subComponentInfos = getSubComponentInfos(mainPath, subComponentNames, importedVariables, fileInfo);

    // 合并主文件和子组件的信息
    return mergeComponentInfos(mainPath, mainComponentInfo, subComponentInfos);
  }

  /**
   * 获取指定URI对应的TS文件信息
   * @param tsUri 文件URI
   * @returns 文件信息
   */
  public async get(tsUri: TsUri): Promise<ComponentInfo> {
    const fsPath = tsUri.fsPath;

    const tsFileInfo = this.infoCache[fsPath];

    if (!tsFileInfo) {
      return await this.update(tsUri);
    } else {
      return tsFileInfo;
    }
  }

  /**
   * 更新指定URI的TS文件信息
   * @param tsUri 文件URI
   * @param text 可选的文件内容，如不提供则从文件系统读取
   * @returns 更新后的文件信息
   */
  public async update(tsUri: TsUri, fileInfo?: FileInfo): Promise<ComponentInfo> {
    const fsPath = tsUri.fsPath;
    if (fileInfo === undefined) {
      fileInfo = [fsPath, (await vscode.workspace.openTextDocument(fsPath)).getText()];
    }

    const tsFileInfo = this.generateComponentInfo(tsUri, fileInfo);

    this.infoCache[fsPath] = tsFileInfo;

    return tsFileInfo;
  }
}

// 导出单例
export const tsFileManager = new TsFile();

/**
 * 设计思想和实现目标
 * 实现: 获取组件信息
 * 1. customComponentInfos 来自于当前文件的变量声明中使用CustomComponent函数的部分 作为比较、验证wxml文件中相同标签名的组件所使用到的变量数据
 */
