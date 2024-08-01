import { DiagnosticErrorType } from "../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "json";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.missingImport}:subA,subB`,
];

export const fiexedDiagnosticList = [];
