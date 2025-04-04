import { escapeOperator, illegalOperators, legalOperators } from "./allOperators";

export function isLikeTernaryExpression(expression: string): boolean {
  return expression.includes("?") || expression.includes(":");
}

// 按长度从长到短排序运算符（合法 + 非法）
const sortedOperators = [
  ...legalOperators,
  ...illegalOperators,
].sort((a, b) => b.length - a.length);
type LegalOperator = string;

// 获取表达式中的非法运算符
export function getIllegalChar(expression: string): null | LegalOperator {
  let remainingStr = expression;

  // 逐个匹配运算符
  for (const operator of sortedOperators) {
    const escapedOperator = escapeOperator(operator); // 转义运算符
    const regex = new RegExp(`(^|\\s|[^\\w])${escapedOperator}($|\\s|[^\\w])`, "g"); // 添加边界

    if (regex.test(remainingStr)) {
      // @ts-ignore
      if (illegalOperators.includes(operator)) {
        return operator; // 如果匹配到非法运算符，返回该运算符
      } else {
        // 如果匹配到合法运算符，移除该运算符  用一个空格替换
        remainingStr = remainingStr.replace(regex, " ");
      }
    }
  }

  return null; // 如果没有匹配到任何非法运算符，返回 null
}

// 示例非法的

// const testString1 = "a & b"; // 包含位运算符 `&`，非法
// const testString2 = "a | b"; // 包含位运算符 `|`，非法
// const testString3 = "a ^ b"; // 包含位运算符 `^`，非法
// const testString4 = "a ~ b"; // 包含位运算符 `~`，非法
// const testString5 = "a << b"; // 包含位运算符 `<<`，非法
// const testString6 = "a >> b"; // 包含位运算符 `>>`，非法
// const testString7 = "a >>> b"; // 包含位运算符 `>>>`，非法
// const testString8 = "a = b"; // 包含赋值运算符 `=`，非法
// const testString9 = "a += b"; // 包含赋值运算符 `+=`，非法
// const testString10 = "a -= b"; // 包含赋值运算符 `-=`，非法
// const testString11 = "a *= b"; // 包含赋值运算符 `*=`，非法
// const testString12 = "a /= b"; // 包含赋值运算符 `/=`，非法
// const testString13 = "a %= b"; // 包含赋值运算符 `%=`，非法
// const testString14 = "a **= b"; // 包含赋值运算符 `**=`，非法
// const testString15 = "a <<= b"; // 包含赋值运算符 `<<=`，非法
// const testString16 = "a >>= b"; // 包含赋值运算符 `>>=`，非法
// const testString17 = "a >>>= b"; // 包含赋值运算符 `>>>=`，非法
// const testString18 = "a &= b"; // 包含赋值运算符 `&=`，非法
// const testString19 = "a |= b"; // 包含赋值运算符 `|=`，非法
// const testString20 = "a ^= b"; // 包含赋值运算符 `^=`，非法
// const testString21 = "a in b"; // 包含特殊运算符 `in`，非法
// const testString22 = "a instanceof b"; // 包含特殊运算符 `instanceof`，非法
// const testString23 = "typeof a"; // 包含特殊运算符 `typeof`，非法
// const testString24 = "void a"; // 包含特殊运算符 `void`，非法
// const testString25 = "delete a"; // 包含特殊运算符 `delete`，非法
// const testString26 = "new a"; // 包含特殊运算符 `new`，非法
// const testString27 = "this"; // 包含特殊运算符 `this`，非法
// const testString28 = "super"; // 包含特殊运算符 `super`，非法
// const testString29 = "a ?? b"; // 包含空值合并运算符 `??`，非法
// const testString30 = "a?.b"; // 包含可选链运算符 `?.`，非法
// // 示例合法的
// const testString31 = "a + b === c"; // 包含合法运算符 `+`，合法
// const testString32 = "a - b"; // 包含合法运算符 `-`，合法
// const testString33 = "a * b"; // 包含合法运算符 `*`，合法
// const testString34 = "a / b"; // 包含合法运算符 `/`，合法
// const testString35 = "a % b"; // 包含合法运算符 `%`，合法
// const testString36 = "a ** b"; // 包含合法运算符 `**`，合法
// const testString37 = "a === b"; // 包含合法运算符 `===`，合法
// const testString38 = "a !== b"; // 包含合法运算符 `!==`，合法
// const testString39 = "a > b"; // 包含合法运算符 `>`，合法
// const testString40 = "a < b"; // 包含合法运算符 `<`，合法
// const testString41 = "a >= b"; // 包含合法运算符 `>=`，合法
// const testString42 = "a <= b"; // 包含合法运算符 `<=`，合法
// const testString43 = "a && b"; // 包含合法运算符 `&&`，合法
// const testString44 = "a || b"; // 包含合法运算符 `||`，合法
// const testString45 = "!a"; // 包含合法运算符 `!`，合法
// const testString46 = "a, b"; // 包含合法运算符 `,`，合法
// const testString47 = "a;"; // 包含合法运算符 `;`，合法
// const testString48 = "a()"; // 包含合法运算符 `()`，合法
// const testString49 = "a[]"; // 包含合法运算符 `[]`，合法
// const testString50 = "a{}"; // 包含合法运算符 `{}`，合法
// // 边界实例
// const testString51 = "instanceofVar"; // instanceofVar包含instanceof,但不应该被匹配到 应该合法
// const testString52 = "newVar"; // newVar包含new,但不应该被匹配到 应该合法
// const testString53 = "deleteVar"; // deleteVar包含delete,但不应该被匹配到 应该合法

// // 测试
// console.log(1, hasIllegalChar(testString1)); // false
// console.log(2, hasIllegalChar(testString2)); // false
// console.log(3, hasIllegalChar(testString3)); // false
// console.log(4, hasIllegalChar(testString4)); // false
// console.log(5, hasIllegalChar(testString5)); // false
// console.log(6, hasIllegalChar(testString6)); // false
// console.log(7, hasIllegalChar(testString7)); // false
// console.log(8, hasIllegalChar(testString8)); // false
// console.log(9, hasIllegalChar(testString9)); // false
// console.log(10, hasIllegalChar(testString10)); // false
// console.log(11, hasIllegalChar(testString11)); // false
// console.log(12, hasIllegalChar(testString12)); // false
// console.log(13, hasIllegalChar(testString13)); // false
// console.log(14, hasIllegalChar(testString14)); // false
// console.log(15, hasIllegalChar(testString15)); // false
// console.log(16, hasIllegalChar(testString16)); // false
// console.log(17, hasIllegalChar(testString17)); // false
// console.log(18, hasIllegalChar(testString18)); // false
// console.log(19, hasIllegalChar(testString19)); // false
// console.log(20, hasIllegalChar(testString20)); // false
// console.log(21, hasIllegalChar(testString21)); // false
// console.log(22, hasIllegalChar(testString22)); // false
// console.log(23, hasIllegalChar(testString23)); // false
// console.log(24, hasIllegalChar(testString24)); // false
// console.log(25, hasIllegalChar(testString25)); // false
// console.log(26, hasIllegalChar(testString26)); // false
// console.log(27, hasIllegalChar(testString27)); // false
// console.log(28, hasIllegalChar(testString28)); // false
// console.log(29, hasIllegalChar(testString29)); // false
// console.log(30, hasIllegalChar(testString30)); // false
// console.log("下面是合法的应该为true");
// console.log(31, hasIllegalChar(testString31)); // true
// console.log(32, hasIllegalChar(testString32)); // true
// console.log(33, hasIllegalChar(testString33)); // true
// console.log(34, hasIllegalChar(testString34)); // true
// console.log(35, hasIllegalChar(testString35)); // true
// console.log(36, hasIllegalChar(testString36)); // true
// console.log(37, hasIllegalChar(testString37)); // true
// console.log(38, hasIllegalChar(testString38)); // true
// console.log(39, hasIllegalChar(testString39)); // true
// console.log(40, hasIllegalChar(testString40)); // true
// console.log(41, hasIllegalChar(testString41)); // true
// console.log(42, hasIllegalChar(testString42)); // true
// console.log(43, hasIllegalChar(testString43)); // true
// console.log(44, hasIllegalChar(testString44)); // true
// console.log(45, hasIllegalChar(testString45)); // true
// console.log(46, hasIllegalChar(testString46)); // true
// console.log(47, hasIllegalChar(testString47)); // true
// console.log(48, hasIllegalChar(testString48)); // true
// console.log(49, hasIllegalChar(testString49)); // true
// console.log(50, hasIllegalChar(testString50)); // true
// // 边界
// console.log(51, hasIllegalChar(testString51)); // true
// console.log(52, hasIllegalChar(testString52)); // true
// console.log(53, hasIllegalChar(testString53)); // true

// // 复杂表达式
// console.log(hasIllegalChar("a + b * c - d / e")); // true（合法）
// console.log(hasIllegalChar("a + b * c = d / e")); // false（匹配 `=`，非法）
