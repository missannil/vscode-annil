import { DiagnosticErrorType, type ErrorValue } from "../../../../../src/diagnosticFixProvider/errorType";
import type { CheckType } from "../../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.errorValue}:_id` satisfies ErrorValue,
  `${DiagnosticErrorType.errorValue}:numA` satisfies ErrorValue,
  `${DiagnosticErrorType.errorValue}:userList` satisfies ErrorValue,
];

export const fiexedDiagnosticList = [];
