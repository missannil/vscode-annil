// function isTernaryExpression(expression: string): boolean {
//   const ternaryPattern = /[^?]+\?[^:]+:[^:]+/;

//   return ternaryPattern.test(expression);
// }

// function extractOuterTernary(expression: string): [string, string] {
//   let questionMarkCount = 0;
//   let colonCount = 0;
//   let questionMarkIndex = -1;
//   let colonIndex = -1;

//   for (let i = 0; i < expression.length; i++) {
//     if (expression[i] === "?") {
//       questionMarkCount++;
//       if (questionMarkCount === 1) {
//         questionMarkIndex = i;
//       }
//     } else if (expression[i] === ":") {
//       colonCount++;
//       if (questionMarkCount === colonCount) {
//         colonIndex = i;
//         break;
//       }
//     }
//   }

//   const trueValue = expression
//     .substring(questionMarkIndex + 1, colonIndex)
//     .trim();
//   const falseValue = expression.substring(colonIndex + 1).trim();

//   return [trueValue, falseValue];
// }

// // 解析字符串表达式可能的值(三元表达式字符串可能有多个值,如: "a?b:c" => ["b", "c"])
// function parseExpressionValues(
//   expression: string,
//   values: string[] = [],
// ): string[] {
//   // 判断表达式是否是三元表达式
//   if (!isTernaryExpression(expression)) {
//     values.push(expression);
//   } else {
//     // 获取三元表达式第一个问号后面到最后一个冒号之前的表达式为正确的表达式,最后一个冒号后面的表达式为错误的表达式
//     const [trueValue, falseValue] = extractOuterTernary(expression);
//     parseExpressionValues(trueValue, values);
//     parseExpressionValues(falseValue, values);
//   }

//   return values;
// }
