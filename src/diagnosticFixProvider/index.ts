/* eslint-disable @typescript-eslint/no-var-requires */
import * as vscode from "vscode";
import { jsonFileManager } from "../componentManager/jsonFileManager";

import { type JsonUri, uriHelper } from "../componentManager/uriHelper";
import { diagnosticCollection } from "../diagnosticCollection";
import { assertNonNullable } from "../utils/assertNonNullable";

import { EXTENSION_NAME } from "../utils/constants";

import { componentManager } from "../componentManager";
import type { ImportTypeInfo } from "../componentManager/tsFileManager/types";
import { generateCodeActionOfWxml, generateFixAllActionOfWxml } from "./codeActionGenerator";
import { generateCodeActionOfJson, generateFixAllActionOfJson } from "./codeActionGeneratorOfJson";
import { DiagnosticErrorType, type DiagnosticMessage } from "./errorType";

type EOL = "\n" | "\r\n";
// type UsingComponentsInfo = { startline: number; indent: string; endline: number; endCharacter: number };
/**
 * 每个组件的检查都有通过的逻辑,我想把通用的部分提取出来,这样每个组件的检查逻辑就不会重复了
 * 如何做到抽象呢，我想到了使用策略模式,每个组件的检查逻辑都是一个策略,这样就可以把通用的部分提取出来了
 */
class CodeActionsProviderManager {
  private getEOL(text: string): EOL {
    // 使用 \n 分隔文本
    const lines = text.split("\n");
    // 检查第一行是否以 \r 结尾
    if (lines[0].endsWith("\r")) {
      return "\r\n"; // Windows 风格的换行符
    }

    return "\n"; // Unix/Linux/macOS 风格的换行符
  }

  private getReplaceContent(eol: EOL, indent: string, importedSubCompInfo: ImportTypeInfo): string {
    let res = `"usingComponents": {${eol}`;
    const entries = Object.entries(importedSubCompInfo);
    entries.forEach(([compName, compPath], index) => {
      // 判断当前元素是否为最后一个元素
      const isLastElement = index === entries.length - 1;
      // 如果是最后一个元素，则不添加逗号；否则，添加逗号
      res += `${indent.repeat(2)}"${compName}": "${compPath}"${isLastElement ? "" : ","}${eol}`;
    });
    res += `${indent}}`;

    return res;
  }
  /**
   * 针对三种情况:
   * 1. 有usingComponents,后面是  `{}`
   * 2. 有usingComponents,后面是 `{`
   * 3. 没有usingComponents
   */
  // eslint-disable-next-line complexity
  private getReplaceRange(jsonText: string): vscode.Range {
    let startLine = -1, startCharacter = 0, endLine = 0, endCharacter = 0;
    const textLines = jsonText.split("\n");
    const allBreace = /"usingComponents":\s*{\s*}\s*/;
    const onlyLeftBrace = /"usingComponents":\s*{\s*$/;
    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i];
      const matchAllBreace = allBreace.exec(line);
      if (matchAllBreace !== null) {
        startCharacter = matchAllBreace.index;
        endCharacter = startCharacter + matchAllBreace[0].length;

        return new vscode.Range(i, startCharacter, i, endCharacter);
      } else {
        const matchLeftBreace = onlyLeftBrace.exec(line);
        if (matchLeftBreace !== null) {
          startLine = i;
          startCharacter = matchLeftBreace.index;
          continue;
        } else {
          // startLine改变后接着找右边的花括号行(初始值为-1)
          if (startLine !== -1 && /\s*}/.test(line)) {
            endLine = i;
            endCharacter = line.length;

            return new vscode.Range(startLine, startCharacter, endLine, endCharacter);
          }
        }
      }
    }
    // console.log("没有找到usingComponents定义");
    // 没有usingComponents时 重新遍历,虽然代码臃肿了,但是逻辑更清晰
    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i];
      // {} 的情况时
      const matchAll = /^\s*{\s*}\s*/.exec(line);
      if (matchAll !== null) {
        const startLine = i;
        const beforeBraceLength = matchAll[0].indexOf("{");
        const startCharacter = matchAll.index + beforeBraceLength + 1; // 位置在{的后面

        return new vscode.Range(startLine, startCharacter, startLine, startCharacter);
      }

      // 找到}就赋值，这样最后赋值的}所在的行为结束行
      if (/\s*}/.test(line)) {
        startLine = i;
        endLine = i;
      }
    }

    return new vscode.Range(startLine, startCharacter, endLine, endCharacter);
  }
  private isMissingImport(message: DiagnosticErrorType): message is DiagnosticErrorType.missingImport {
    return message === DiagnosticErrorType.missingImport;
  }
  private isUnknownImport(message: DiagnosticErrorType): message is DiagnosticErrorType.unknownImport {
    return message === DiagnosticErrorType.unknownImport;
  }
  private isErrorImportPath(message: DiagnosticErrorType): message is DiagnosticErrorType.errorImportPath {
    return message === DiagnosticErrorType.errorImportPath;
  }

  private replaceUsingComponentsOfJson(
    jsonUri: JsonUri,
    jsonText: string,
    diagnostic: vscode.Diagnostic,
    codeAction: vscode.CodeAction,
  ): vscode.CodeAction | undefined {
    const replaceRange = this.getReplaceRange(jsonText);
    const expectedImport = JSON.parse(diagnostic.code as string);
    const replaceContent = this.getReplaceContent(
      this.getEOL(jsonText),
      "  ", // 两个空格缩进
      expectedImport,
    ) as string;

    codeAction.edit?.replace(
      jsonUri,
      replaceRange,
      replaceContent,
    );

    this.addFormatDocumentCommand(jsonUri, codeAction);

    return codeAction;
  }
  private addFormatDocumentCommand(uri: vscode.Uri, codeAction: vscode.CodeAction): void {
    codeAction.command = {
      title: "Format Document",
      command: "editor.action.formatDocument",
      arguments: [uri],
    };
  }
  public generateFixUseingComponent(
    jsonUri: JsonUri,
    diagnosticList: readonly vscode.Diagnostic[],
    jsonText: string,
  ): vscode.CodeAction {
    const fixAllAction = new vscode.CodeAction(
      "修复全部",
      vscode.CodeActionKind.QuickFix,
    );
    // 都是对同一个文件进行编辑,所以只需要一个WorkspaceEdit实例
    fixAllAction.edit = new vscode.WorkspaceEdit();

    // 多种错误类型,处理方式都是replace,所以只需要一个replaceAction
    let needReplaceAction = false;

    diagnosticList.forEach(diagnostic => {
      const message = diagnostic.message as DiagnosticMessage;
      if (this.isMissingImport(message) || this.isUnknownImport(message) || this.isErrorImportPath(message)) {
        needReplaceAction = true;
      }
    });
    if (needReplaceAction) {
      this.replaceUsingComponentsOfJson(jsonUri, jsonText, diagnosticList[0], fixAllAction);
    }
    this.addFormatDocumentCommand(jsonUri, fixAllAction);
    // // 还没有其他错误,后续添加

    return fixAllAction;
  }
  private isMineDiagnostic(source: string | undefined): boolean {
    return source === EXTENSION_NAME;
  }
  private provideCodeActions(
    document: vscode.TextDocument,
    context: vscode.CodeActionContext,
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const wxmlUri = document.uri;
    if (!uriHelper.isComponentUri(wxmlUri, ".wxml") || context.diagnostics.length === 0) return;
    const diagnosticList = context.diagnostics;
    const codeActionList: vscode.CodeAction[] = [];
    // 选中诊断的修复程序
    diagnosticList.forEach(diagnostic => {
      // 诊断信息的source属性是插件名,只有插件名是自己的诊断信息才提供修复程序(避免干扰其他插件)
      if (this.isMineDiagnostic(diagnostic.source)) {
        codeActionList.push(...generateCodeActionOfWxml(wxmlUri, diagnostic));
      }
    });

    return codeActionList;
  }
  private provideCodeActionsOfJson(
    document: vscode.TextDocument,
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const jsonUri = document.uri as JsonUri;
    // 不是组件文件,不提供修复程序
    if (!uriHelper.isComponentUri(jsonUri)) return;
    // 诊断程序可能有多个
    const codeActionList: vscode.CodeAction[] = [];
    // 选中诊断的修复程序
    const jsonDiagnosticList = assertNonNullable(diagnosticCollection.get(jsonUri));

    // codeActionList.push(...generateCodeAction(jsonUri, diagnostic));
    jsonDiagnosticList.forEach(diagnostic => {
      // 诊断信息的source属性是插件名,只有插件名是自己的诊断信息才提供修复程序(避免干扰其他插件)
      if (!this.isMineDiagnostic(diagnostic.source)) return;
      const jsonText = document.getText();
      codeActionList.push(...generateCodeActionOfJson(jsonUri, jsonText, diagnostic));
    });

    return codeActionList;
  }
  /**
   * @param context
   */
  private registerCodeActionsProvider(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider("wxml", {
        provideCodeActions: (document, _range, context) => this.provideCodeActions(document, context),
      }),
      vscode.languages.registerCodeActionsProvider("json", {
        provideCodeActions: (document) => this.provideCodeActionsOfJson(document),
      }),
    );
  }
  private registerCheckAll(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand("annil.check-all", async () => {
        // 找到工作区内所有的wxml文件
        const allWxmlFiles = await vscode.workspace.findFiles("**/*.wxml");
        for (const wxmlUri of allWxmlFiles) {
          // 打开wxml文件
          await vscode.workspace.openTextDocument(wxmlUri);
        }
      }),
    );
  }
  private registerAllFixCommand(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand("annil.fix-all", async (testUri?: vscode.Uri) => {
        const activeEditor = vscode.window.activeTextEditor;
        let uri = testUri || activeEditor?.document.uri;
        if (!uri) return;
        const relatedUri = componentManager.relatedUris[uri.fsPath];
        if (relatedUri) {
          uri = relatedUri;
        }
        if (!uriHelper.isComponentUri(uri)) return;
        const wxmlUri = uriHelper.getSiblingUri(uri, ".wxml");
        const wxmlDiagnosticList = diagnosticCollection.get(wxmlUri);
        if (wxmlDiagnosticList && wxmlDiagnosticList.length > 0) {
          const fixAllAction = generateFixAllActionOfWxml(wxmlUri, wxmlDiagnosticList);
          await vscode.workspace.applyEdit(assertNonNullable(fixAllAction.edit));
          await vscode.commands.executeCommand("editor.action.formatDocument", wxmlUri);
        }
        const jsonUri = uriHelper.getSiblingUri(uri, ".json");
        const jsonDiagnosticList = diagnosticCollection.get(jsonUri);
        if (jsonDiagnosticList && jsonDiagnosticList.length > 0) {
          const jsonText = (await jsonFileManager.get(jsonUri)).text;
          const fixAllAction = generateFixAllActionOfJson(
            jsonUri,
            jsonText,
            jsonDiagnosticList,
          );
          await vscode.workspace.applyEdit(assertNonNullable(fixAllAction.edit));
          await vscode.commands.executeCommand("editor.action.formatDocument", jsonUri);
        }

        return Promise.resolve();
      }),
    );
  }
  public init(context: vscode.ExtensionContext): void {
    // 注册提供修复程序的代码动作提供程序
    this.registerCodeActionsProvider(context);
    // 为快捷键注册修复全部的命令
    this.registerAllFixCommand(context);
    // 注册打开工作区内全部wxml文件的命
    this.registerCheckAll(context);
  }
}

export const codeActionsProviderManager = new CodeActionsProviderManager();
