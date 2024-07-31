import { DiagnosticErrorType } from "../../../src/diagnosticFixProvider/errorType";
import type { CheckType } from "../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.mustacheSyntax}:_id`,
];

export const fiexedDiagnosticList = [];
