// 判断一个成员表达式是以点号开头的,要求传入的字符串是一个成员表达式
export function isMemberExpressionStartOfDot(str: string): boolean {
  // 以.分割
  const partsOfDot = str.split(".");
  // 以[]分割
  const partsOfBracket = str.split("[");
  if (partsOfDot.length > 0) {
    if (partsOfBracket.length === 0) {
      return true;
    }
    // 以.分割的长度大于1,并且第一部分长度小于partsOfBracket第一个部分长度
    if (partsOfDot[0].length < partsOfBracket[0].length) {
      // 说明是以.开头的
      return true;
    }

    return false;
  } else {
    if (partsOfBracket.length === 0) {
      throw new Error("传入的字符串不是一个成员表达式");
    }

    return false;
  }
}

// 测试用例
// const testCasesTrue = [
//   "a.b.c",
//   "a.c[ddd.xxx]",
//   "a.b.c['xxx']",
// ];
// const testCasesFalse = [
//   "a[0]",
//   "a['b']",
//   "a[ddd.xxx]"
// ];
// testCasesTrue.forEach(testCase => {
//   console.log(`${testCase}: ${isMemberExpressionStartOfDot(testCase)}`);
// });
// console.log("--------------------------------------------------");
// testCasesFalse.forEach(testCase => {
//   console.log(`${testCase}: ${isMemberExpressionStartOfDot(testCase)}`);
// });
