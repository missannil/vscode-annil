import { DiagnosticErrorType, type NonArrType } from "../../../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
];

export const fiexedDiagnosticList = [
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
];
