import { DiagnosticErrorType, type MissPrerequisite } from "../../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.missPrerequisite}:wx:if | wx:elif` satisfies MissPrerequisite,
  `${DiagnosticErrorType.missPrerequisite}:wx:if | wx:elif` satisfies MissPrerequisite,
  `${DiagnosticErrorType.missPrerequisite}:wx:if | wx:elif` satisfies MissPrerequisite,
];
