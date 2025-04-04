// import { isMemberVariableExpression } from "./isMemberVariableExpression";

// export function getFirstOfPathVariable(str: string): string {
//   if (!isMemberVariableExpression(str)) {
//     throw new Error(`Invalid path variable: ${str}`);
//   }

//   return str.split(/\.|\[/)[0];
// }

// const testCases = [
//   "aaa.xxx",
//   "bbb[0].xxx",
//   "ccc.yyy['xxx'].ddd[0].zzz",
// ];

// testCases.forEach(testCase => {
//   console.log(`${testCase}: ${getFirstOfPathVariable(testCase)}`);
// });
