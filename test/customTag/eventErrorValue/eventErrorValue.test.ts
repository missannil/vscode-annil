import type { ErrorValue } from "src/diagnosticFixProvider/errorType";
import type { CheckType } from "src/runTest";
import { DiagnosticErrorType } from "../../../src/diagnosticFixProvider/errorType";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.errorValue}:bind:aaa` satisfies ErrorValue,
  `${DiagnosticErrorType.errorValue}:bind:bbb` satisfies ErrorValue,
  `${DiagnosticErrorType.errorValue}:bind:ccc` satisfies ErrorValue,
];

export const fiexedDiagnosticList = [];
