import * as vscode from "vscode";
import type { UsingComponents } from "../../componentManager/jsonFileManager";
import type { JsonUri } from "../../componentManager/uriHelper";
import { assertNonNullable } from "../../utils/assertNonNullable";
import { DiagnosticErrorType, DiagnosticMessage } from "../errorType";
import { generateInsertAction } from "./generateInsertAction";
import { generateInvalidPathAction } from "./generateInvalidPathAction";
import { generateDeleteKeyAction } from "./generateUnknownImportAction";

export function isMissingImportsMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.missingImport {
  return errMsg === DiagnosticErrorType.missingImport;
}

export function isUnknownImportErrMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.unknownImport {
  return errMsg === DiagnosticErrorType.unknownImport;
}

export function isInvalidPathMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.invalidPath {
  return errMsg === DiagnosticErrorType.invalidPath;
}

export function isMissingPlaceholderMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.missingPlaceholder {
  return errMsg === DiagnosticErrorType.missingPlaceholder;
}

export function isUnknownPlaceholderMsg(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.unknownPlaceholder {
  return errMsg === DiagnosticErrorType.unknownPlaceholder;
}

export function generateCodeActionOfJson(
  jsonUri: JsonUri,
  jsonText: string,
  diagnostic: vscode.Diagnostic,
  // 未传入codeAction时,会根据诊断错误类型生成一个codeAction并编辑修复程序(单错误修复),传入时则直接编辑修复程序(用于修复全部)
  codeAction?: vscode.CodeAction,
): vscode.CodeAction[] {
  const codeActionList: vscode.CodeAction[] = [];
  const errMsg = diagnostic.message as DiagnosticMessage;
  if (isMissingImportsMsg(errMsg)) {
    const missingImportsKey = diagnostic.code as string;
    const expectImport = assertNonNullable(diagnostic.info?.expectImport) as UsingComponents;
    codeActionList.push(
      generateInsertAction(
        jsonUri,
        jsonText,
        [missingImportsKey, expectImport[missingImportsKey]],
        "添加缺失的导入",
        "usingComponents",
        codeAction,
      ),
    );

    return codeActionList;
  }
  if (isUnknownImportErrMsg(errMsg)) {
    const unknownImportKey = diagnostic.code as string;
    codeActionList.push(generateDeleteKeyAction(jsonUri, jsonText, unknownImportKey, "usingComponents", codeAction));

    return codeActionList;
  }

  if (isInvalidPathMsg(errMsg)) {
    const invalidPath = diagnostic.code as string;
    const correctPath = diagnostic.info?.correctPath as string;
    codeActionList.push(generateInvalidPathAction(jsonUri, jsonText, invalidPath, correctPath, codeAction));

    return codeActionList;
  } else if (isMissingPlaceholderMsg(errMsg)) {
    const placeholderKey = diagnostic.code as string;
    codeActionList.push(
      generateInsertAction(
        jsonUri,
        jsonText,
        [placeholderKey, "view"],
        "添加缺失的占位组件",
        "componentPlaceholder",
        codeAction,
      ),
    );

    return codeActionList;
  } else if (isUnknownPlaceholderMsg(errMsg)) {
    const unknownComponentPlaceholderKey = diagnostic.code as string;
    codeActionList.push(
      generateDeleteKeyAction(jsonUri, jsonText, unknownComponentPlaceholderKey, "componentPlaceholder", codeAction),
    );

    return codeActionList;
  }
  console.warn(`无法处理的错误类型: ${errMsg}`);

  return codeActionList;
}

export function generateFixAllActionOfJson(
  jsonUri: JsonUri,
  jsonText: string,
  diagnosticList: readonly vscode.Diagnostic[],
): vscode.CodeAction {
  const fixAllAction = new vscode.CodeAction(
    "修复全部",
    // vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.SourceFixAll,
  );
  // 都是对同一个文件进行编辑,所以只需要一个WorkspaceEdit实例
  fixAllAction.edit = new vscode.WorkspaceEdit();

  diagnosticList.forEach(diagnostic => generateCodeActionOfJson(jsonUri, jsonText, diagnostic, fixAllAction));

  return fixAllAction;
}
