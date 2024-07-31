import { DiagnosticErrorType, type ErrorValue, type MissingAttr } from "../../../src/diagnosticFixProvider/errorType";
import type { CheckType } from "../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.missingAttr}:custom` satisfies MissingAttr,
  `${DiagnosticErrorType.missingAttr}:_rootData` satisfies MissingAttr,
  `${DiagnosticErrorType.missingAttr}:self` satisfies MissingAttr,
  `${DiagnosticErrorType.missingAttr}:bind:eventA` satisfies MissingAttr,
];

export const fiexedDiagnosticList = [
  `${DiagnosticErrorType.errorValue}:custom` satisfies ErrorValue,
];
