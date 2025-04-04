import { legalOperators } from "./allOperators";
import { isStringOrNumber } from "./isStringOrNumber";

function escapeSpecialCharacter(str: string): string {
  return str.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
}

export function getSubExpressions(str: string): string[] {
  // 用空格替换所有的operators
  legalOperators.forEach((op) => {
    str = str.replace(new RegExp(escapeSpecialCharacter(op), "g"), "🤭");
  });
  // 去掉字符串两端的空白字符
  const expressions: string[] = [];

  str.trim().split("🤭").forEach((item) => {
    item = item.trim();
    if (!isStringOrNumber(item)) {
      expressions.push(item);
    }
  });

  return expressions;
}
// const testStr =
//   "item.xxx[g  g].ddd === 123 > 'aaa' && ttt' || ddd > ccc && item[zzz].ddd[0]['yyy].4xxx[1yyy] === aaa";
// console.log(getSubExpressions(testStr));
