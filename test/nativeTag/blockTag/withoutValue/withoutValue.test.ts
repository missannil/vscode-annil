import {
  DiagnosticErrorType,
  type InvalidValue,
  type NonArrType,
  type WithoutValue,
} from "../../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.withoutValue}:wx:for` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:wx:for-index` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:wx:for-item` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:wx:key` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:wx:if` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:wx:elif` satisfies WithoutValue,
];

export const fiexedDiagnosticList = [
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.invalidValue}:wx:for-index` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:for-item` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:key` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:if` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:elif` satisfies InvalidValue,
];
