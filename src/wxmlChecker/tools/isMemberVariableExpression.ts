/* eslint-disable complexity */
/* eslint-disable no-useless-escape */
export function isMemberVariableExpression(str: string): boolean {
  // 特殊情况处理
  // 1. 检查是否包含点号或方括号，如果不包含，则不是成员表达式
  if (!str.includes(".") && !str.includes("[")) {
    return false;
  }

  // 2. 检查边缘情况
  if (str.endsWith(".") || str.endsWith("[")) {
    return false; // 不允许以点号或左括号结尾
  }

  // 使用递归检查嵌套表达式
  function isValid(expr: string): boolean {
    // 检查括号是否平衡
    let bracketCount = 0;
    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === "[") bracketCount++;
      else if (expr[i] === "]") bracketCount--;

      // 如果在任何时刻括号不平衡，返回false
      if (bracketCount < 0) return false;
    }
    if (bracketCount !== 0) return false; // 最终括号应该平衡

    // 移除不允许空格的检查，使规则更宽松

    // 基本正则模式，修改为允许空格，但不允许以点号结尾
    const basePattern = /^(?!\d+$)[^.[\](){}'"?:]+(?:\.[^.[\](){}'"?:]+|\[[^\[\]]*\])*$/;

    if (!basePattern.test(expr)) {
      return false;
    }

    // 检查中括号内的嵌套表达式
    // eslint-disable-next-line no-useless-escape
    const bracketMatches = expr.match(/\[([^\[\]]*)\]/g);
    if (bracketMatches) {
      for (const match of bracketMatches) {
        const inner = match.substring(1, match.length - 1);
        // 如果内部包含点号且不是字符串，递归检查
        if (inner.includes(".") && !(/^['"][^'"]*['"]\s*$/.test(inner))) {
          // 去掉括号后检查内部表达式
          if (!isValid(inner)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  return isValid(str);
}

// 测试用例
// const testCasesTrue = [
//   "#aaa.xxx", // true   宽松规则，允许变量名以数字开头）
//   "aaa[1ddd]", // true
//   "_bbb[0].xxx", // true
//   "1bbb[0].xxx", // true（宽松规则，允许变量名以数字开头）
//   "ccc.yyy['xxx'].ddd[0].zzz", // true
//   "aaa[ddd.id]", // true
//   "aaa.xx  x", // true （宽松规则，允许空格）
//   "aaa.2xxx", // true（宽松规则，允许变量名以数字开头）
//   "bbb[0].#xxx", // true（宽松规则，允许非法字符）
// ];
// const testCasesFalse = [
//   "aaa[[0].yyy", // false（多余的 [）
//   "aaa[0]].yyy", // false（多余的 ]）
//   "aaa.", // false（. 后面没有变量名）
//   "aaa[", // false（[ 没有闭合）
//   "aaa]", // false（] 没有闭合）
//   "xxx ? aaa : 123", // false（不是成员变量表达式，没有 . 或成对的中括号）
//   "aaa > bbb === ccc", // false（不是成员变量表达式，没有 . 或成对的中括号）
//   "subGoods", // false（不是成员变量表达式，没有 . 或成对的中括号）
// ];

// testCasesTrue.forEach(testCase => {
//   console.log(`${testCase}: ${isMemberVariableExpression(testCase)}`);
// });
// console.log("--------------------------------------------------");
// testCasesFalse.forEach(testCase => {
//   console.log(`${testCase}: ${isMemberVariableExpression(testCase)}`);
// });
