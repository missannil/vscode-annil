import { DiagnosticErrorType } from "../../../out/diagnosticFixProvider/errorType";
import type { CheckType } from "../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.duplicate}:num-aA`,
  `${DiagnosticErrorType.duplicate}:numA-a`,
];

export const fiexedDiagnosticList = [];
