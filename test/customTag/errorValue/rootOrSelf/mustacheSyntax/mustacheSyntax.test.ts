import type { MustacheSyntax } from "../../../../../src/diagnosticFixProvider/errorType";
import { DiagnosticErrorType } from "../../../../../src/diagnosticFixProvider/errorType";
import type { CheckType } from "../../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.mustacheSyntax}:_id` satisfies MustacheSyntax,
  `${DiagnosticErrorType.mustacheSyntax}:numA` satisfies MustacheSyntax,
  `${DiagnosticErrorType.mustacheSyntax}:userList` satisfies MustacheSyntax,
];

export const fiexedDiagnosticList = [];
