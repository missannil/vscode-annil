/* eslint-disable @typescript-eslint/no-var-requires */
import * as vscode from "vscode";
import { jsonFileManager } from "../componentManager/jsonFileManager";
import type { ImportInfo } from "../componentManager/tsFileManager";
import { type JsonUri, uriHelper, type WxmlUri } from "../componentManager/uriHelper";
import { diagnosticManager } from "../diagnosticManager";
import { assertNonNullable } from "../utils/assertNonNullable";
import {
  type ConditionalAttrExisted,
  DiagnosticErrorType,
  type DiagnosticMessage,
  type Duplicate,
  type ErrorImportPath,
  type InvalidValue,
  type MissingAttr,
  type MissingComopnent,
  type MissingImport,
  type MissingNeedfulAttr,
  type MissPrerequisite,
  type MustacheSyntax,
  type ShouldwithoutValue,
  type UnknownAttr,
  type UnknownImport,
  type UnknownTag,
  type WithoutValue,
} from "./errorType";

type EOL = "\n" | "\r\n";
// type UsingComponentsInfo = { startline: number; indent: string; endline: number; endCharacter: number };
/**
 * 每个组件的检查都有通过的逻辑,我想把通用的部分提取出来,这样每个组件的检查逻辑就不会重复了
 * 如何做到抽象呢，我想到了使用策略模式,每个组件的检查逻辑都是一个策略,这样就可以把通用的部分提取出来了
 */
class DiagnosticFixProvider {
  private isMissingComponent(diagnosticMessage: DiagnosticMessage): diagnosticMessage is MissingComopnent {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.missingComopnent;
  }
  private isMissingAttr(diagnosticMessage: DiagnosticMessage): diagnosticMessage is MissingAttr {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.missingAttr;
  }
  private isMustacheSyntaxError(diagnosticMessage: DiagnosticMessage): diagnosticMessage is MustacheSyntax {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.mustacheSyntax;
  }
  private isNonArrTypeError(diagnosticMessage: DiagnosticMessage): diagnosticMessage is MustacheSyntax {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.nonArrType;
  }
  private isErrorValue(diagnosticMessage: DiagnosticMessage): diagnosticMessage is MustacheSyntax {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.errorValue;
  }
  private isDuplicate(diagnosticMessage: DiagnosticMessage): diagnosticMessage is Duplicate {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.duplicate;
  }
  private isUnknown(diagnosticMessage: DiagnosticMessage): diagnosticMessage is UnknownAttr {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.unknownAttr;
  }
  private isMissingNeedful(diagnosticMessage: DiagnosticMessage): diagnosticMessage is MissingNeedfulAttr {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.missingNeedfulAttr;
  }
  private isUnknownTag(diagnosticMessage: DiagnosticMessage): diagnosticMessage is UnknownTag {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.unknownTag;
  }
  private isUnknownImport(diagnosticMessage: DiagnosticMessage): diagnosticMessage is UnknownImport {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.unknownImport;
  }
  private isConditionalAttrExisted(diagnosticMessage: DiagnosticMessage): diagnosticMessage is ConditionalAttrExisted {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.conditionalAttrExisted;
  }
  private isMissPrerequisite(diagnosticMessage: DiagnosticMessage): diagnosticMessage is MissPrerequisite {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.missPrerequisite;
  }
  private isWithoutValue(diagnosticMessage: DiagnosticMessage): diagnosticMessage is WithoutValue {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.withoutValue;
  }
  private InvalidValue(diagnosticMessage: DiagnosticMessage): diagnosticMessage is InvalidValue {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.invalidValue;
  }
  private isShouldwithoutValue(diagnosticMessage: DiagnosticMessage): diagnosticMessage is ShouldwithoutValue {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.shouldwithoutValue;
  }
  private isMissingImport(diagnosticMessage: DiagnosticMessage): diagnosticMessage is MissingImport {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.missingImport;
  }
  private isErrorImportPath(diagnosticMessage: DiagnosticMessage): diagnosticMessage is ErrorImportPath {
    return diagnosticMessage.split(":")[0] === DiagnosticErrorType.errorImportPath;
  }

  private editInsert(
    wxmlUri: WxmlUri,
    diagnostic: vscode.Diagnostic,
    diagnosticMessage: DiagnosticMessage,
    codeAction?: vscode.CodeAction,
  ): vscode.CodeAction {
    if (!codeAction) {
      const missingAttrName = diagnosticMessage.split(":")[1];
      codeAction = new vscode.CodeAction(
        `添加${missingAttrName}属性`,
        vscode.CodeActionKind.QuickFix,
      );
      codeAction.edit = new vscode.WorkspaceEdit();
    }
    // 生成诊断时借用code属性存储了正确的值 前面加个空格避免和元素标签粘连在一起
    const fixContent = assertNonNullable(diagnostic.code) as string;
    const insertCharactor = " " + fixContent;
    assertNonNullable(codeAction.edit).insert(
      wxmlUri,
      diagnostic.range.end,
      insertCharactor,
    );

    return codeAction;
  }
  private editReplace(
    wxmlUri: WxmlUri,
    diagnostic: vscode.Diagnostic,
    codeAction?: vscode.CodeAction,
  ): vscode.CodeAction {
    if (!codeAction) {
      codeAction = new vscode.CodeAction(
        "修复",
        vscode.CodeActionKind.QuickFix,
      );
      codeAction.edit = new vscode.WorkspaceEdit();
    }
    const fixContent = assertNonNullable(diagnostic.code) as string;
    assertNonNullable(codeAction.edit).replace(wxmlUri, diagnostic.range, fixContent);

    return codeAction;
  }
  private editDelete(
    wxmlUri: WxmlUri,
    diagnostic: vscode.Diagnostic,
    codeAction?: vscode.CodeAction,
  ): vscode.CodeAction {
    if (!codeAction) {
      codeAction = new vscode.CodeAction(
        "删除",
        vscode.CodeActionKind.QuickFix,
      );
      codeAction.edit = new vscode.WorkspaceEdit();
    }
    assertNonNullable(codeAction.edit).delete(wxmlUri, diagnostic.range);

    return codeAction;
  }
  // eslint-disable-next-line complexity
  private editCodeAction(
    wxmlUri: WxmlUri,
    diagnostic: vscode.Diagnostic,
    // 未传入codeAction时,会根据诊断错误类型生成一个codeAction并编辑修复程序(单错误修复),传入时则直接编辑修复程序(用于修复全部)
    codeAction?: vscode.CodeAction,
  ): vscode.CodeAction | undefined {
    // 在生成诊断时,已将错误类型存储在诊断的message属性中
    const diagnosticMessage = diagnostic.message as DiagnosticMessage;
    // 缺失组件无法提供修复程序
    if (
      this.isMissingComponent(diagnosticMessage) || this.isMissingNeedful(diagnosticMessage)
      || this.isMissPrerequisite(diagnosticMessage)
    ) return;
    if (this.isMissingAttr(diagnosticMessage)) {
      return this.editInsert(wxmlUri, diagnostic, diagnosticMessage, codeAction);
    }
    if (this.isWithoutValue(diagnosticMessage)) {
      return this.editReplace(wxmlUri, diagnostic, codeAction);
    }
    if (this.InvalidValue(diagnosticMessage)) {
      if (diagnostic.code !== undefined) {
        return this.editReplace(wxmlUri, diagnostic, codeAction);
      }
    }
    if (
      this.isMustacheSyntaxError(diagnosticMessage) || this.isErrorValue(diagnosticMessage)
      || this.isNonArrTypeError(diagnosticMessage)
    ) {
      if (diagnostic.code !== undefined) {
        return this.editReplace(wxmlUri, diagnostic, codeAction);
      }
    }
    if (
      this.isDuplicate(diagnosticMessage)
      || this.isUnknown(diagnosticMessage)
      || this.isUnknownImport(diagnosticMessage)
      || this.isConditionalAttrExisted(diagnosticMessage)
    ) {
      return this.editDelete(wxmlUri, diagnostic, codeAction);
    }
    if (this.isShouldwithoutValue(diagnosticMessage)) {
      return this.editReplace(wxmlUri, diagnostic, codeAction);
    }
  }
  private getEOL(text: string): EOL {
    // 使用 \n 分隔文本
    const lines = text.split("\n");
    // 检查第一行是否以 \r 结尾
    if (lines[0].endsWith("\r")) {
      return "\r\n"; // Windows 风格的换行符
    }

    return "\n"; // Unix/Linux/macOS 风格的换行符
  }

  private getReplaceContent(eol: EOL, indent: string, importedSubCompInfo: ImportInfo): string {
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
  // 建立每一个选中诊断位置的修复程序
  private generateFixActions(
    wxmlUri: WxmlUri,
    diagnosticList: readonly vscode.Diagnostic[],
  ): vscode.CodeAction[] {
    return diagnosticList
      .map(diagnostic => this.editCodeAction(wxmlUri, diagnostic)).filter(Boolean) as vscode.CodeAction[];
  }
  // private generateFixActionsOfJson(
  //   jsonUri: JsonUri,
  //   jsonText: string,
  //   diagnosticList: readonly vscode.Diagnostic[],
  // ): vscode.CodeAction[] {
  //   return diagnosticList
  //     .map(diagnostic => this.editCodeActionOfJson(jsonUri, jsonText, diagnostic)).filter(
  //       Boolean,
  //     ) as vscode.CodeAction[];
  // }
  private addFormatDocumentCommand(uri: vscode.Uri, codeAction: vscode.CodeAction): void {
    codeAction.command = {
      title: "Format Document",
      command: "editor.action.formatDocument",
      arguments: [uri],
    };
  }
  public generateFixAllAction(
    wxmlUri: WxmlUri,
    diagnosticList: readonly vscode.Diagnostic[],
  ): vscode.CodeAction {
    const fixAllAction = new vscode.CodeAction(
      "修复全部",
      vscode.CodeActionKind.QuickFix,
    );
    // 都是对同一个文件进行编辑,所以只需要一个WorkspaceEdit实例
    fixAllAction.edit = new vscode.WorkspaceEdit();

    diagnosticList.forEach(diagnostic => this.editCodeAction(wxmlUri, diagnostic, fixAllAction));
    this.addFormatDocumentCommand(wxmlUri, fixAllAction);

    return fixAllAction;
  }
  public generateFixAllActionOfJson(
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
    // 还没有其他错误,后续添加

    return fixAllAction;
  }
  private provideCodeActions(
    document: vscode.TextDocument,
    context: vscode.CodeActionContext,
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const wxmlUri = document.uri as WxmlUri;
    if (!uriHelper.isComponentUri(wxmlUri) || context.diagnostics.length === 0) return;
    const codeActionList: vscode.CodeAction[] = [];
    // 选中诊断的修复程序
    const selectedDiagnosticListFixActions = this.generateFixActions(wxmlUri, context.diagnostics);
    codeActionList.push(...selectedDiagnosticListFixActions);
    // 全部诊断的修复程序
    const diagnosticList = assertNonNullable(diagnosticManager.get(wxmlUri));
    codeActionList.push(this.generateFixAllAction(wxmlUri, diagnosticList));

    return codeActionList;
  }
  private provideCodeActionsOfJson(
    document: vscode.TextDocument,
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const jsonUri = document.uri as JsonUri;
    // 不是组件文件(考虑到可能是其他插件给json的诊断,这里还不够严谨),不提供修复程序
    if (!uriHelper.isComponentUri(jsonUri)) return;
    const jsonText = document.getText();
    const codeActionList: vscode.CodeAction[] = [];
    // 选中诊断的修复程序
    const jsonDiagnosticList = assertNonNullable(diagnosticManager.get(jsonUri));
    const fixAllAction = this.generateFixAllActionOfJson(jsonUri, jsonDiagnosticList, jsonText);
    codeActionList.push(fixAllAction);

    return codeActionList;
  }
  /**
   * @param context
   */
  private registerFixProvider(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider("wxml", {
        provideCodeActions: (document, _range, context) => this.provideCodeActions(document, context),
      }),
      vscode.languages.registerCodeActionsProvider("json", {
        provideCodeActions: (document) => this.provideCodeActionsOfJson(document),
      }),
    );
  }
  private registerAllFixCommand(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand("annil.fix-diagnostics", async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return;
        const uri = activeEditor.document.uri;
        if (!uriHelper.isComponentUri(uri)) return;
        const wxmlUri = uriHelper.getSiblingUri(uri, ".wxml");
        const wxmlDiagnosticList = diagnosticManager.get(wxmlUri);
        if (wxmlDiagnosticList && wxmlDiagnosticList.length > 0) {
          const fixAllAction = this.generateFixAllAction(wxmlUri, wxmlDiagnosticList);
          void vscode.workspace.applyEdit(assertNonNullable(fixAllAction.edit));
        }
        const jsonUri = uriHelper.getSiblingUri(uri, ".json");
        const jsonDiagnosticList = diagnosticManager.get(jsonUri);
        if (jsonDiagnosticList && jsonDiagnosticList.length > 0) {
          const jsonText = (await jsonFileManager.get(jsonUri)).text;
          const fixAllAction = this.generateFixAllActionOfJson(jsonUri, jsonDiagnosticList, jsonText);
          void vscode.workspace.applyEdit(assertNonNullable(fixAllAction.edit));
        }
      }),
    );
  }
  public init(context: vscode.ExtensionContext): void {
    this.registerFixProvider(context);
    this.registerAllFixCommand(context);
  }
}

export const diagnosticFixProvider = new DiagnosticFixProvider();
