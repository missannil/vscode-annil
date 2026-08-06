import { path, process } from "#deps";

export function getUserSnippetsPath(): string {
  const testSnippetsPath = process.env.ANNIL_TEST_SNIPPETS_PATH;
  if (testSnippetsPath !== undefined && testSnippetsPath !== "") return testSnippetsPath;

  const appDataPath = process.platform === "win32"
    ? process.env.APPDATA
    : process.platform === "darwin"
    ? path.join(process.env.HOME as string, "Library/Application Support")
    : path.join(process.env.HOME as string, ".config");

  return path.join(appDataPath as string, "Code", "User", "snippets");
}
