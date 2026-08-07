import { assert, fileURLToPath, fs, path } from "#deps";
import { describe as suite, it as test } from "mocha";
import { configuration } from "../../../../_src/configuration/index.js";
import { traverseAst } from "../../../../_src/core/tsAnalyzer/index.js";
import { resolveImportedSubComponentPaths } from "../../../../_src/core/tsAnalyzer/resolveImportedSubComponentPaths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

suite("resolveAlias", () => {
  test("无 tsconfig paths 时使用 app.json resolveAlias 生成 usingComponents 路径", () => {
    const tsFsPath = path.resolve(
      __dirname,
      "../../../../../_test/suite/tsAnalyzer/resolveAlias/resolveAliasComponent.ts",
    );
    const tsText = fs.readFileSync(tsFsPath, "utf-8");
    const tsInfo = traverseAst(tsFsPath, tsText, configuration.innerDataPrefix);

    assert.deepStrictEqual(
      resolveImportedSubComponentPaths(tsFsPath, tsInfo.importedSubComponentSourceRecord),
      {
        aliasCard: "/components/cards/aliasCard",
        aliasPanel: "/components/panels/aliasPanel",
      },
    );
  });
});
