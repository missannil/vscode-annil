import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as vscode from "vscode";

// 类型导入
import type { TsUri } from "../uriHelper";
import type { ChangedTsFileInfo, CustomComponentMap, ImportTypeInfo, TsFileFsPath, TsFileInfo } from "./types";

// 功能函数导入
import path from "path";
import { assertNonNullable } from "../../utils/assertNonNullable";
import { componentManager } from "..";
import { parseImportedInfo } from "./generateImportedSubCompInfo";
import { getChunkComponentInfo } from "./getChunkComponentInfo";
import { getExternalComponentFilePaths } from "./getExternalComponentFilePath";
import { getImportTypeInfo } from "./getImportTypeInfo";
import { getRootComponentInfo } from "./getRootComponentInfo";
import { getCustomComponentInfo } from "./getSubComponentInfo";
import { getSubComponentNames } from "./getSubComponentNames";
import { getSubFileInfo } from "./getSubFileInfo";

/**
 * TS文件解析管理类
 */
class TsFile {
  /**
   * 缓存已解析的文件信息
   */
  private infoCache: Record<TsFileFsPath, TsFileInfo | undefined> = {};

  /**
   * 解析TS文件内容
   * @param tsText TS文件文本内容
   * @param tsUri 文件URI
   * @returns 解析后的TS文件信息
   */
  public tsFileParser(tsUri: TsUri, tsText: string): TsFileInfo {
    // 解析TS代码为AST
    const tsFileAST = parse(tsText, { sourceType: "module", plugins: ["typescript"] });

    // 获取所有的子组件名(从DefineComponent的subComopnents中获取)
    const subComponentNames = getSubComponentNames(tsFileAST);
    // 初始化返回的文件信息结构
    const tsFileInfo: TsFileInfo = {
      chunkComopnentInfos: {},
      customComponentInfos: {},
      rootComponentInfo: {
        dataList: [],
        events: [],
        customEvents: [],
        arrTypeDatas: [],
        boolTypeDatas: [],
      },
      importedSubCompInfo: {},
    };
    // console.log("hry 全部子组件", subComponentNames);
    // 组件名和组件类型名的映射关系表 例如 const h_iamge = SubComponent<root,$Image,"xx"> 映射后为 {h_image: $Image}
    const customComponentMap: CustomComponentMap = {};
    const importTypeInfo: ImportTypeInfo = {};

    // 获取外部导入的组件名和路径
    const externalComponentFilePaths = getExternalComponentFilePaths(tsFileAST, subComponentNames);
    // console.log("hry 外部依赖文件路径", externalComponentFilePaths);
    // 处理外部组件信息
    for (const subComponentName in externalComponentFilePaths) {
      const subComponentPath = externalComponentFilePaths[subComponentName];
      const relatedUri = vscode.Uri.joinPath(tsUri, "..", subComponentPath + ".ts") as TsUri;

      // 作为关联的文件加入到组件管理器中,以便在变化时可以触发更新
      if (!componentManager.isRelatedUri(relatedUri)) {
        componentManager.setRelatedUris(relatedUri.fsPath, tsUri);
      }
      const subComponentInfo = getSubFileInfo(
        subComponentName,
        // 关联文件的URI
        relatedUri,
      );
      // console.log("hry 外部文件依赖信息", subComponentInfo, subComponentName);
      if (subComponentInfo) {
        if (subComponentInfo.componentInfo) {
          if (subComponentInfo.componentInfo.type === "chunk") {
            tsFileInfo.chunkComopnentInfos[subComponentName] = subComponentInfo.componentInfo.info;
            // console.log("hry 把外部的chunk信息加入到最终的信息中", tsFileInfo.chunkComopnentInfos);
          } else if (subComponentInfo.componentInfo.type === "custom") {
            customComponentMap[subComponentName] = subComponentInfo.componentInfo.componentTypeName;
            tsFileInfo.customComponentInfos[subComponentName] = subComponentInfo.componentInfo.info;
            // console.log("hry 把外部的custom信息加入到最终的信息中并把import信息保留在map中", tsFileInfo.customComponentInfos[subComponentName], customComponentMap[subComponentName]);
          }
        }
        Object.assign(importTypeInfo, subComponentInfo.importTypeInfo);
        // console.log("hry 把外部文件的导入信息加入到临时文件中", importTypeInfo);
      }
      // console.log("hry 获取下一个外部路径信息",);
    }

    // 遍历AST解析组件信息
    traverse(tsFileAST, {
      // 从导入的文件中获取组件信息
      ImportDeclaration(path) {
        Object.assign(importTypeInfo, getImportTypeInfo(path));
      },

      // 从当前文件声明的变量中获取组件信息
      /* eslint-disable @typescript-eslint/no-explicit-any */
      VariableDeclarator(variableDeclarator: any) {
        const customComponentInfo = getCustomComponentInfo(variableDeclarator, subComponentNames);
        if (customComponentInfo) {
          const variableName = variableDeclarator.node.id.name;
          customComponentMap[variableName] = variableDeclarator.node.init.callee?.typeParameters?.params[1]?.typeName
            ?.name;
          tsFileInfo.customComponentInfos[variableName] = customComponentInfo;
          // console.log("hry 得到本地的自定义组件信息", customComponentInfo, variableDeclarator.node.init.callee?.typeParameters?.params[1]?.typeName?.name);

          return;
        }
        const chunkComponentInfo = getChunkComponentInfo(variableDeclarator, subComponentNames);
        if (chunkComponentInfo) {
          const variableName = variableDeclarator.node.id.name;
          tsFileInfo.chunkComopnentInfos[variableName] = chunkComponentInfo;
          // console.log("hry 得到本地的chunk组件信息", chunkComponentInfo, variableName);
        }

        const rootComponentInfo = getRootComponentInfo(variableDeclarator);
        if (rootComponentInfo) {
          tsFileInfo.rootComponentInfo = rootComponentInfo;
          // console.log("hry 得到本地的root组件信息", chunkComponentInfo, rootComponentInfo);
        }
      },
    });

    // 解析导入的子组件信息
    tsFileInfo.importedSubCompInfo = parseImportedInfo(customComponentMap, importTypeInfo, tsUri);
    // console.log("hry 过滤后的import信息", tsFileInfo.importedSubCompInfo);
    // console.log("hry 最终的信息", tsFileInfo);

    return tsFileInfo;
  }

  /**
   * 获取指定URI对应的TS文件信息
   * @param tsUri 文件URI
   * @returns 文件信息
   */
  public async get(tsUri: TsUri): Promise<TsFileInfo> {
    const fsPath = tsUri.fsPath;
    const tsFileInfo = this.infoCache[fsPath];

    if (!tsFileInfo) {
      return await this.update(tsUri, { type: "main" });
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
  public async update(tsUri: TsUri, changedInfo: ChangedTsFileInfo): Promise<TsFileInfo> {
    if (changedInfo.type === "related") {
      const fileName = path.parse(changedInfo.uri.fsPath).name;
      const componentInfo = assertNonNullable(getSubFileInfo(fileName, changedInfo.text)?.componentInfo);
      const tsFileInfo = assertNonNullable(this.infoCache[tsUri.fsPath]);
      if (componentInfo.type === "chunk") {
        tsFileInfo.chunkComopnentInfos[fileName] = componentInfo.info;
      } else if (componentInfo.type === "custom") {
        tsFileInfo.customComponentInfos[fileName] = componentInfo.info;
      }

      return tsFileInfo;
    }

    const fsPath = tsUri.fsPath;
    let mainText: string;
    if (changedInfo.text === undefined) {
      mainText = (await vscode.workspace.openTextDocument(fsPath)).getText();
    } else {
      mainText = changedInfo.text;
    }
    const tsFileInfo = this.tsFileParser(tsUri, mainText);

    this.infoCache[fsPath] = tsFileInfo;

    return tsFileInfo;
  }
}

// 导出单例
export const tsFileManager = new TsFile();
