/**
 * 校验变量名是否符合 JavaScript 标识符规范。
 *
 * 规则：只允许字母、数字、下划线、$ 符号，且不能以数字开头。
 */
const VARIABLE_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

/**
 * 判断表达式是否为合法变量名。
 *
 * 注意：这里只做"语法层面"校验，不检查变量是否在合法数据列表中。
 *
 * @returns true 表示语法合法，false 表示不合法应产生 `invalidVariable` 诊断
 */
export function isValidVariableName(expression: string): boolean {
  return VARIABLE_RE.test(expression);
}
