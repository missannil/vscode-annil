import { DiagnosticErrorType } from "../../../src/diagnosticFixProvider/errorType";
import type { CheckType } from "../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.missingComopnent}:subC`,
  `${DiagnosticErrorType.missingComopnent}:subD`,
  `${DiagnosticErrorType.missingComopnent}:subE`,
  `${DiagnosticErrorType.missingComopnent}:subDXx`,
];
