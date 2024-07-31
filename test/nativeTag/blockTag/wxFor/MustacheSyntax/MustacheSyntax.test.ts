import {
  DiagnosticErrorType,
  type MustacheSyntax,
  type NonArrType,
} from "../../../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.mustacheSyntax}:wx:for` satisfies MustacheSyntax,
  `${DiagnosticErrorType.mustacheSyntax}:wx:for` satisfies MustacheSyntax,
];

export const fiexedDiagnosticList = [
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
];
