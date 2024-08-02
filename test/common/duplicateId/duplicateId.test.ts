// void test(componentUri, "wxml", []);
import { DiagnosticErrorType, type DuplicateId } from "../../../src/diagnosticFixProvider/errorType";
import type { CheckType } from "../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.duplicateId}` satisfies DuplicateId,
  `${DiagnosticErrorType.duplicateId}` satisfies DuplicateId,
];

export const fiexedDiagnosticList = [];
