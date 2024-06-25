/**
 * @param func
 * @param delay
 * @returns
 */
export function debounce<A extends unknown[]>(
  func: (...args: A) => unknown,
  delay: number,
): (...args: A) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function(this: unknown, ...args: A): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => func.call(this, ...args), delay);
  };
}
