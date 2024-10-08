import { DiagnosticErrorType } from "../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "json";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.unknownImport}:subDe`,
  `${DiagnosticErrorType.unknownImport}:subEE`,
];

export const fiexedDiagnosticList = [];
