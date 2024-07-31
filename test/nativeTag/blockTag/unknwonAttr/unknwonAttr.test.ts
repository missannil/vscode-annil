import { DiagnosticErrorType, type UnknownAttr } from "../../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.unknownAttr}:wx:forA` satisfies UnknownAttr,
  `${DiagnosticErrorType.unknownAttr}:wx:forB` satisfies UnknownAttr,
  `${DiagnosticErrorType.unknownAttr}:wx:forC` satisfies UnknownAttr,
  `${DiagnosticErrorType.unknownAttr}:wx:forD` satisfies UnknownAttr,
];

export const fiexedDiagnosticList = [];
