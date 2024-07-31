import type { UnknownTag } from "../../../src/diagnosticFixProvider/errorType";
import { DiagnosticErrorType } from "../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.unknownTag}:subC` satisfies UnknownTag,
  `${DiagnosticErrorType.unknownTag}:subB` satisfies UnknownTag,
];
