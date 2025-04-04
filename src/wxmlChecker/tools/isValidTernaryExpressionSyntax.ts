// eslint-disable-next-line complexity
export function isValidTernaryExpressionSyntax(expression: string): boolean {
  expression = expression.trim();
  if (!expression.includes("?") || !expression.includes(":")) return false;
  const stack = [];
  let preChart = "";
  const length = expression.length;
  for (let i = 0; i < length; i++) {
    const char = expression[i];

    if (char === "?") {
      // 如果是第一个字符
      if (i === 0) {
        return false;
      }
      stack.push(char);
    } else if (char === ":") {
      // 如果是第一个字符或者最后一个字符或者前面没有对应的 ? 或者最近的字符是 ? 则返回 false
      if (i === 0 || i === length - 1 || stack.length === 0 || preChart === "?") {
        return false;
      }

      stack.pop();
    }
    // 记录前一个非空格字符
    char !== " " && (preChart = char);
  }

  return stack.length === 0; // 确保所有 ? 都有对应的 :
}
