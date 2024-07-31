import { type ConditionalAttrExisted, DiagnosticErrorType } from "../../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.conditionalAttrExisted}:wx:if` satisfies ConditionalAttrExisted,
  `${DiagnosticErrorType.conditionalAttrExisted}:wx:if` satisfies ConditionalAttrExisted,
];

export const fiexedDiagnosticList = [];
