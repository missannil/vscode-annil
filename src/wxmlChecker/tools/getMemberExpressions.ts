/* eslint-disable complexity */
// import { isStringOrNumber } from "./isStringOrNumber";

// 获取成员表达式中各个成员的表达式(就是返回. 或者[]之间的表达式(字符串)),忽略数字或字符串类型的成员
export function getMemberExpressions(str: string): string[] {
  const result: string[] = [];
  let current = "";
  let bracketDepth = 0;
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    // 处理引号
    if (
      (char === "'" || char === "\"")
      && (i === 0 || str[i - 1] !== "\\")
    ) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
      }
    }

    // 处理方括号
    if (char === "[" && !inQuotes) {
      if (bracketDepth === 0 && current) {
        result.push(current);

        current = "";
      }
      bracketDepth++;
      if (bracketDepth > 1) {
        current += char;
      }
    } else if (char === "]" && !inQuotes) {
      bracketDepth--;
      if (bracketDepth === 0 && current) {
        // 检查方括号内的内容是否为字符串或数字

        result.push(current);

        current = "";
      } else if (bracketDepth > 0) {
        current += char;
      }
    } // 处理点号
    else if (char === "." && !inQuotes && bracketDepth === 0) {
      if (current) {
        result.push(current);

        current = "";
      }
    } // 其他字符
    else {
      current += char;
    }
  }

  // 处理最后一部分
  if (current) {
    result.push(current);
  }

  // 过滤掉数字并把字符串2边的引号去掉
  return result
    .filter((item) => {
      const trimmedItem = item.trim();

      return (
        trimmedItem !== ""
        && !/^\d+$/.test(trimmedItem) // 过滤掉纯数字
        && !/^[\s'"]*$/.test(trimmedItem) // 过滤掉空格和引号
      );
    })
    .map((item) => item.replace(/^[\s'"]+|[\s'"]+$/g, ""));
}

// 测试用例
// const testCases2 = [
//   "aaa.xx x", // => ["aaa", "xx x"]
//   "_bbb[0].x xx", // => ["_bbb", "x xx"] - 忽略 "0"
//   "ccc.yyy['1xxx'].ddd[0].1z zz", // => ["ccc", "yyy",'1xxx', "ddd", "1z zz"] - 忽略  "0"
//   "aaa.2xxx", // => ["aaa", "2xxx"]
//   "bbb[0].#xxx", // => ["bbb", "#xxx"] - 忽略 "0"
//   "aaa[bbb._id]", // => ["aaa", "bbb._id"] - 保持方括号内的整体结构
// ];

// testCases2.forEach(testCase => {
//   console.log(`${testCase}: ${JSON.stringify(getMemberExpressions(testCase))}`);
// });
