function _generateTernaryExpression(values: string[], index: number): string {
  if (values.length === 1) {
    return values[0];
  }
  // 递归生成嵌套的三元表达式
  const first = values[0];
  const rest = values.slice(1);

  return ` 条件表达式${index} ? ${first} : ${_generateTernaryExpression(rest, index + 1)}`;
}

export function generateTernaryExpression(values: string[]): string {
  if (values.length === 1) {
    throw ("generateTernaryExpression 参数 至少需要两个值");
  }

  return _generateTernaryExpression(values, 0);
}

// // 测试案例
// console.log(generateTernaryExpression(["a"])); // 错误 generateTernaryExpression 参数 至少需要两个值
// console.log(generateTernaryExpression(["a", "b"])); // "'条件' ? 'a' : 'b'"
// console.log(generateTernaryExpression(["a", "b", "c"])); // "'条件' ? 'a' : '条件' ? 'b' : 'c'"
// console.log(generateTernaryExpression(["a", "b", "c", "d"])); // "'条件' ? 'a' : '条件' ? 'b' : '条件' ? 'c' : 'd'"
// console.log(generateTernaryExpression(["x", "y", "z", "w", "v"])); // "'条件' ? 'x' : '条件' ? 'y' : '条件' ? 'z' : '条件' ? 'w' : 'v'"
