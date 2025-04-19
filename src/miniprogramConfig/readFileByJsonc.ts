import { fs, jsonc, type PlainObject } from "../publicModule";

export function readFileByJsonc(filePath: string): PlainObject | null {
  try {
    const tsConfigText = fs.readFileSync(filePath, "utf-8");

    return jsonc.parse(tsConfigText);
  } catch (error) {
    console.warn(`读取 tsconfig.json 失败: ${error}`);
  }

  return null;
}
