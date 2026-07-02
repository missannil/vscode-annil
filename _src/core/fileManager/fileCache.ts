/**
 * 通用文件缓存层
 * 负责文件读取 + 缓存管理，解析逻辑由外部 Parser 提供
 */
export class FileCache<T> {
  #cache = new Map<string, T>();

  public get(fsPath: string): T | undefined {
    return this.#cache.get(fsPath);
  }

  public set(fsPath: string, info: T): void {
    this.#cache.set(fsPath, info);
  }

  public invalidate(fsPath: string): void {
    this.#cache.delete(fsPath);
  }

  public has(fsPath: string): boolean {
    return this.#cache.has(fsPath);
  }
}
