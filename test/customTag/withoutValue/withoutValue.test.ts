import { DiagnosticErrorType, type ErrorValue, type WithoutValue } from "../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.withoutValue}:_id` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:numA` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:userList` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:bind:onTap` satisfies WithoutValue,
];

export const fiexedDiagnosticList = [
  `${DiagnosticErrorType.errorValue}:_id` satisfies ErrorValue,
];
