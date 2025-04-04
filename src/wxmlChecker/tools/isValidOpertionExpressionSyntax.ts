import { escapeOperator, legalOperators } from "./allOperators";

function isLikeOperationExpression(expression: string): boolean {
  return legalOperators.some((op) => expression.includes(op));
}

// eslint-disable-next-line complexity
export function _isValidOpertionExpressionSyntax(expression: string): boolean {
  // 去除两边空格和括号
  expression = expression.trim();
  //   if (expression.startsWith("(") && expression.endsWith(")")) {
  //     expression = expression.slice(1, -1).trim();
  //   }
  if (expression === "") return false;
  for (const operator of legalOperators.sort((a, b) => b.length - a.length)) {
    const regex = new RegExp(escapeOperator(operator));
    // 获取匹配到的运算符左右两边的字符
    const match = expression.match(regex);

    if (match) {
      //   console.log(operator);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const index = match.index!;
      const left = expression.slice(0, index);
      if (operator === "!") continue;
      //   console.log(left);
      if (left.trim() === "" || isLikeOperationExpression(left) && !_isValidOpertionExpressionSyntax(left)) {
        return false;
      }

      const right = expression.slice(index + match[0].length);
      //   console.log(right);
      if (right.trim() === "" || isLikeOperationExpression(right) && !_isValidOpertionExpressionSyntax(right)) {
        return false;
      }

      return true;
    }
  }

  return true;
}

export function isValidOpertionExpressionSyntax(expression: string): boolean {
  if (expression === "!") return false;
  // 判断括号是否正对
  if (expression.split("(").length !== expression.split(")").length) {
    return false;
  }
  // 去除所有的括号
  expression = expression.replace(/\(|\)/g, "");

  return isLikeOperationExpression(expression) && _isValidOpertionExpressionSyntax(expression);
}
// // 合法的算术运算符表达式
// console.log(isValidOpertionExpressionSyntax("1aaa + #bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa - bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa * bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa / bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa % bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa ** bbb")); // true
// // 非法的算术运算符表达式
// console.log(isValidOpertionExpressionSyntax("aaa +")); // false，运算符右边为空
// console.log(isValidOpertionExpressionSyntax(" + bbb")); // false，运算符左边为空
// console.log(isValidOpertionExpressionSyntax("aaa * ")); // false，运算符右边为空
// // 合法的比较运算符表达式
// console.log(isValidOpertionExpressionSyntax("aaa > bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa < bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa >= bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa <= bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa == bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa === bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa != bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa !== bbb")); // true
// // 非法的比较运算符表达式
// console.log(isValidOpertionExpressionSyntax("aaa >")); // false，运算符右边为空
// console.log(isValidOpertionExpressionSyntax("<= bbb")); // false，运算符左边为空
// console.log(isValidOpertionExpressionSyntax("aaa ===")); // false，运算符右边为空
// // 合法的逻辑运算符表达式
// console.log(isValidOpertionExpressionSyntax("aaa && bbb")); // true
// console.log(isValidOpertionExpressionSyntax("aaa || bbb")); // true
// console.log(isValidOpertionExpressionSyntax("!aaa")); // true，逻辑非运算符
// // 非法的逻辑运算符表达式
// console.log(isValidOpertionExpressionSyntax("aaa &&")); // false，运算符右边为空
// console.log(isValidOpertionExpressionSyntax("|| bbb")); // false，运算符左边为空
// console.log(isValidOpertionExpressionSyntax("!")); // false
// // 合法的混合运算符表达式
// console.log(isValidOpertionExpressionSyntax("aaa + bbb > ccc")); // true
// console.log(isValidOpertionExpressionSyntax("aaa && bbb || ccc")); // true
// console.log(isValidOpertionExpressionSyntax("(aaa + bbb) > (ccc && ddd)")); // true
// // 非法的混合运算符表达式
// console.log(isValidOpertionExpressionSyntax("aaa + > bbb")); // false，运算符右边为空
// console.log(isValidOpertionExpressionSyntax("aaa && || bbb")); // false，运算符右边为空
// console.log(isValidOpertionExpressionSyntax("(aaa +) > bbb")); // false，运算符右边为空
// // 边界情况
// console.log(isValidOpertionExpressionSyntax("!")); // false
// console.log(isValidOpertionExpressionSyntax("(aaa>bbb * (a - b) ")); // 不正对的括号 false
// console.log(isValidOpertionExpressionSyntax("")); // false
// // 嵌套括号：
// console.log(isValidOpertionExpressionSyntax("(aaa + bbb) > ccc")); // true
// console.log(isValidOpertionExpressionSyntax("aaa > (bbb && ccc)")); // true
// console.log(isValidOpertionExpressionSyntax("(aaa + (bbb > ccc)) && ddd")); // true
// // 复杂嵌套：
// console.log(isValidOpertionExpressionSyntax("(aaa + (bbb > ccc)) && (ddd || eee)")); // true
// // 6. 非法表达式
// console.log(isValidOpertionExpressionSyntax("")); // false
// // 表达式只有括号：
// console.log(isValidOpertionExpressionSyntax("()")); // false
// // 包含非法运算符：
// console.log(isValidOpertionExpressionSyntax("aaa & bbb")); // false
// console.log(isValidOpertionExpressionSyntax("aaa | bbb")); // false
