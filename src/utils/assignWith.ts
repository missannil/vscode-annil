// 非函数和数组的对象
type PlainObj = {
  [key: string]: unknown;
  // 数组有Symbol.iterator属性
  [Symbol.iterator]?: never;
  // arguments和caller在ts的Function类型(es5.d.ts)中定义了,所以用它们来判断是不是函数,但如果对象有arguments和caller属性,就会有问题。
  arguments?: never;
  // caller?: never;
};

/**
 * 拓展对象数组
 * @param source 源对象
 * @param extension 拓展对象
 * @returns
 */
export function assignWith<
  Source extends PlainObj,
  Extension extends PlainObj,
>(
  source: Source,
  extension: Extension,
): Source & Extension;

/**
 * 拓展对象数组(把源对象数组中的每个对象添加上拓展函数的返回值)
 * @param source 源对象数组
 * @param extension 拓展函数 参数为源对象数组中的每个对象 返回值为拓展对象
 * @returns
 */
export function assignWith<
  Source extends PlainObj,
  Extension extends PlainObj,
>(
  source: Source[],
  extension: (item: Source) => Extension,
): (Source & Extension)[];

/**
 * 拓展对象或对象数组
 * @param source
 * @param extension
 * @returns
 */
export function assignWith<
  Source extends PlainObj | PlainObj[],
  Extension extends PlainObj | ((item: Source) => Extension),
>(
  source: Source,
  extension: Extension,
): unknown {
  return Array.isArray(source)
    ? source.map((item) => Object.assign(item, (extension as (item: PlainObj) => Extension)(item)))
    : Object.assign(source, extension);
}
