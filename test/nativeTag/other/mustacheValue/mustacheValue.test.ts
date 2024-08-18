import { DiagnosticErrorType, type ErrorValue } from "../../../../src/diagnosticFixProvider/errorType";
import type { CheckType } from "../../../../src/runTest";

export const state: boolean = false;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.errorValue}:twWrapper1` satisfies ErrorValue,
  `${DiagnosticErrorType.errorValue}:twInactiveImage2` satisfies ErrorValue,
];

// export const fiexedDiagnosticList = [

// ];
