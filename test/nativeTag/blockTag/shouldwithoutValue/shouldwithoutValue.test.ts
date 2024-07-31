import { DiagnosticErrorType, type ShouldwithoutValue } from "../../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.shouldwithoutValue}:wx:else` satisfies ShouldwithoutValue,
];

export const fiexedDiagnosticList = [];
