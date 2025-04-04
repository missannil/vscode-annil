import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../diagnosticFixProvider/errorType";
import { generateDiagnostic } from "../tools/generateDiagnostic";
import { isValidMustacheSyntax } from "../tools/isValidMustacheSyntax";
import { regexpHelper } from "../tools/regexpHelper";

export function validateMustacheSyntax(
  attrName: string,
  attValue: string,
  textlines: string[],
  startLine: number,
  diagnosticList: vscode.Diagnostic[],
  replaceCode: string = "",
): boolean {
  if (isValidMustacheSyntax(attValue)) return true;
  diagnosticList.push(generateDiagnostic(
    regexpHelper.getFullValueRegexp(attrName, attValue),
    DiagnosticErrorType.mustacheSyntax,
    textlines,
    startLine,
    { replaceCode },
  ));

  return false;
}
