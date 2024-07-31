import type { CheckType } from "src/runTest";
import { DiagnosticErrorType, type ErrorValue } from "../../../../out/diagnosticFixProvider/errorType";
import type { MustacheSyntax } from "../../../../src/diagnosticFixProvider/errorType";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.errorValue}:numA` satisfies ErrorValue,
  `${DiagnosticErrorType.mustacheSyntax}:numA` satisfies MustacheSyntax,
  `${DiagnosticErrorType.mustacheSyntax}:numA` satisfies MustacheSyntax,
];

export const fiexedDiagnosticList = [
  `${DiagnosticErrorType.errorValue}:numA` satisfies ErrorValue,
  `${DiagnosticErrorType.errorValue}:numA` satisfies ErrorValue,
  `${DiagnosticErrorType.errorValue}:numA` satisfies ErrorValue,
];
