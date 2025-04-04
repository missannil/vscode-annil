/**
 * 获取随机字符串函数
 */
export function getRandomStr(length: number): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }

  return result;
}

// 测试示例
// console.log(getRandomStr(10)); // 输出一个长度为10的随机字符串
