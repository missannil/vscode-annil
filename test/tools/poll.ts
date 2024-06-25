// 每隔一段时间检查一次条件是否满足，满足则执行某个操作并停止检查
export function poll(condition: () => boolean, action: () => void, interval: number): void {
  const timerId = setInterval(() => {
    const conditionResult = condition();
    if (conditionResult) {
      action();
      clearInterval(timerId);
    }
  }, interval);
}
