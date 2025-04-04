import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../diagnosticFixProvider/errorType";
import { assertNonNullable } from "../../../../utils/assertNonNullable";
import { getTernaryExpressionInfo } from "../../../../utils/getTernaryValue";
import { generateDiagnostic } from "../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../tools/regexpHelper";
import { validateExpression } from "../../../validators/validateExpression";

export function validateTernaryExpressionValue(
  ternaryExpression: string,
  trueBranchValidValue: string,
  falseBranchValidValue: string,
  validVariables: string[],
  validMemberVariable: string[],
  textlines: string[],
  startLine: number,
  diagnosticList: vscode.Diagnostic[],
  attrName?: string,
): boolean {
  const { conditions, trueBranches, falseBranches } = getTernaryExpressionInfo(ternaryExpression);
  const conditionExpression = conditions[0];
  const trueBranchValue = trueBranches[0];
  const falseBranchValue = falseBranches[0];

  let correctValues: string[] = [trueBranchValidValue, falseBranchValidValue];

  const isValidTrueValue = correctValues.includes(trueBranchValue);
  if (isValidTrueValue) {
    correctValues = correctValues.filter((value) => value !== trueBranchValue);
  }
  const isValidFalseValue = correctValues.includes(falseBranchValue);
  if (isValidFalseValue) {
    correctValues = correctValues.filter((value) => value !== falseBranchValue);
  }
  if (!isValidTrueValue) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getTrueBranchRegexp(trueBranchValue, attrName),
        DiagnosticErrorType.invalidVariable,
        textlines,
        startLine,
        { replaceCode: assertNonNullable(correctValues.shift()) },
      ),
    );
  }
  if (!isValidFalseValue) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getFalseBranchRegexp(falseBranchValue, attrName),
        DiagnosticErrorType.invalidVariable,
        textlines,
        startLine,
        { replaceCode: assertNonNullable(correctValues.shift()) },
      ),
    );
  }

  const conditionRes = validateExpression(
    conditionExpression,
    validVariables,
    startLine,
    textlines,
    diagnosticList,
    DiagnosticErrorType.invalidVariable,
    validMemberVariable,
    true,
    attrName,
  );

  return conditionRes && isValidTrueValue && isValidFalseValue;
}
