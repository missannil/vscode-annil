import {
  DiagnosticErrorType,
  type InvalidValue,
  type MustacheSyntax,
  type NonArrType,
} from "../../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.mustacheSyntax}:wx:for` satisfies MustacheSyntax,
  `${DiagnosticErrorType.invalidValue}:wx:for-index` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:for-item` satisfies InvalidValue,
  `${DiagnosticErrorType.mustacheSyntax}:wx:if` satisfies MustacheSyntax,
  `${DiagnosticErrorType.invalidValue}:wx:elif` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:if` satisfies InvalidValue,
];

export const fiexedDiagnosticList = [
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.invalidValue}:wx:for-index` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:for-item` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:if` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:elif` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:if` satisfies InvalidValue,
];
