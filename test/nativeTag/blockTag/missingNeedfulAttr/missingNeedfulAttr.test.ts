import { DiagnosticErrorType, type MissingNeedfulAttr } from "../../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.missingNeedfulAttr}:wx:for` satisfies MissingNeedfulAttr,
  `${DiagnosticErrorType.missingNeedfulAttr}:wx:for` satisfies MissingNeedfulAttr,
];
