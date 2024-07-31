/**
 * 防抖函数
 * @param func
 * @param delay
 * @returns
 */
export function debounce<A extends unknown[]>(
  func: (...args: A) => void,
  delay: number,
): (...args: A) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function(this: unknown, ...args: A): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => func.call(this, ...args), delay);
  };
}
