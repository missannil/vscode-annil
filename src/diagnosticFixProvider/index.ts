import * as vscode from "vscode";
import { getSiblingUri } from "../componentManager/getSiblingUri";
import { isComponentUri, type WxmlUri } from "../componentManager/isComponentUri";
import { diagnosticManager } from "../diagnosticManager";
import { assertNonNullable } from "../utils/assertNonNullable";
import {
  type ConditionalAttrExisted,
  DiagnosticErrorType,
  type DiagnosticMessage,
  type Duplicate,
  type InvalidValue,
  type MissingAttr,
  type MissingComopnent,
  type MissingNeedfulAttr,
  type MissPrerequisite,
  type MustacheSyntax,
  type ShouldwithoutValue,
  type UnknownAttr,
  type UnknownImport,
  type WithoutValue,
} from "./errorType";
// /**
//  * 每个组件的检查都有通过的逻辑,我想把通用的部分提取出来,这样每个组件的检查逻辑就不会重复了
//  * 如何做到抽象呢，我想到了使用策略模式,每个组件的检查逻辑都是一个策略,这样就可以把通用的部分提取出来了
//  */
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
  private isUnknownImport(diagnosticMessage: DiagnosticMessage): diagnosticMessage is UnknownImport {
    return diagnosticMessage === DiagnosticErrorType.unknownImport;
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
  // 建立每一个选中诊断位置的修复程序
  private generateFixActions(
    wxmlUri: WxmlUri,
    diagnosticList: readonly vscode.Diagnostic[],
  ): vscode.CodeAction[] {
    return diagnosticList
      .map(diagnostic => this.editCodeAction(wxmlUri, diagnostic)).filter(Boolean) as vscode.CodeAction[];
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

    return fixAllAction;
  }
  private provideCodeActions(
    document: vscode.TextDocument,
    context: vscode.CodeActionContext,
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const wxmlUri = document.uri as WxmlUri;
    if (!isComponentUri(wxmlUri) || context.diagnostics.length === 0) return;
    const codeActionList: vscode.CodeAction[] = [];
    // 选中诊断的修复程序
    const selectedDiagnosticListFixActions = this.generateFixActions(wxmlUri, context.diagnostics);
    codeActionList.push(...selectedDiagnosticListFixActions);
    // 全部诊断的修复程序
    const diagnosticList = assertNonNullable(diagnosticManager.get(wxmlUri));
    codeActionList.push(this.generateFixAllAction(wxmlUri, diagnosticList));

    return codeActionList;
  }
  private registerFixProvider(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider("wxml", {
        provideCodeActions: (document, _range, context) => this.provideCodeActions(document, context),
      }),
    );
  }
  private registerAllFixCommand(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand("annil.fix-diagnostics", () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return;
        const uri = activeEditor.document.uri;
        if (!isComponentUri(uri)) return;
        const wxmlUri = getSiblingUri(uri, ".wxml");
        const diagnosticList = diagnosticManager.get(wxmlUri);
        if (!diagnosticList) return;
        const fixAllAction = this.generateFixAllAction(wxmlUri, diagnosticList);
        void vscode.workspace.applyEdit(assertNonNullable(fixAllAction.edit));
      }),
    );
  }
  public init(context: vscode.ExtensionContext): void {
    this.registerFixProvider(context);
    this.registerAllFixCommand(context);
  }
}

export const diagnosticFixProvider = new DiagnosticFixProvider();
