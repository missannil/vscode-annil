type ConditionFuction = () => boolean;
type ExecuteFunction = () => boolean;

export type Handler = ExecuteFunction | [ConditionFuction, ...ExecuteFunction[]];

/**
 * 执行handlers中的函数，如果为数组，若第一个条件函数结果为true时,则返回 every后续函数。第一个函数结果为false时,执行下一个handler。不为数组时,结果为false时返回false,否则执行下一个handler,全部执行完毕返回true。
 * 为了避免写if else导致eslint复杂度检测报错
 * @param handlers
 * @returns
 */
export function handlers(
  handlers: Handler[],
): boolean {
  for (const handler of handlers) {
    if (Array.isArray(handler)) {
      if (handler[0]()) return handler.slice(1).every((fn) => fn());
      continue;
    } else {
      if (!handler()) return false;
    }
  }

  return true;
}

// 遇到第一个返回false的函数就停止执行
// const test = (): boolean =>
//   runHandlers([
//     (): boolean => {
//       console.log("pass1");

//       return true;
//     },
//     (): boolean => {
//       console.log("pass2");

//       return true;
//     },
//     (): boolean => {
//       console.log("break 3");

//       return false;
//     },
//     (): boolean => {
//       throw new Error("no print 1");
//     },
//   ]);
// console.log(test()); // pass1 pass2 break 3 false

// const testCondition = (): boolean =>
//   runHandlers([
//     [
//       (): boolean => {
//         console.log(" false");

//         return false;
//       },
//       (): boolean => {
//         throw new Error(" no execute ");
//       },
//     ],
//     [
//       (): boolean => {
//         console.log(" true");

//         return true;
//       },
//       (): boolean => {
//         console.log("execute 2");

//         return true;
//       },
//       (): boolean => {
//         console.log("execute 3");

//         return false; // 最终的返回结果
//       },
//     ],
//     (): boolean => {
//       throw new Error("no print 2");
//     },
//   ]);
// console.log(testCondition()); //  false true execute 2 execute 3 false => 最终的返回结果
