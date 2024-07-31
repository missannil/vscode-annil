import type { CheckType } from "src/runTest";
import { DiagnosticErrorType, type ErrorValue } from "../../../../src/diagnosticFixProvider/errorType";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.errorValue}:bind:eventA` satisfies ErrorValue,
  `${DiagnosticErrorType.errorValue}:catch:eventA` satisfies ErrorValue,
];

export const fiexedDiagnosticList = [];
