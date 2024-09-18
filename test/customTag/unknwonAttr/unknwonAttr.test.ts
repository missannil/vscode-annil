import type { UnknownAttr } from "../../../src/diagnosticFixProvider/errorType";
import { DiagnosticErrorType } from "../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.unknownAttr}:aaa` satisfies UnknownAttr,
  `${DiagnosticErrorType.unknownAttr}:class` satisfies UnknownAttr,
  `${DiagnosticErrorType.unknownAttr}:bbb` satisfies UnknownAttr,
  `${DiagnosticErrorType.unknownAttr}:ccc` satisfies UnknownAttr,
];

export const fiexedDiagnosticList = [];
