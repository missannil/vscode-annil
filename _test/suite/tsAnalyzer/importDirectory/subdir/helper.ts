// 该目录没有 index.ts，也没有与目录同名的 .ts 文件。
// `import "./subdir"` 不应解析到本目录（否则 fs.readFileSync 抛 EISDIR）。
export function subdirHelper(): void {
  // noop
}
