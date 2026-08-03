import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnosticUpdate } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("complexExpression", () => {
  test("不误报成员、下标、函数调用、加法和三元表达式", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/expression/complexExpression/complexExpression.wxml",
      ),
    );
    const diagnosticsReady = waitForDiagnosticUpdate(wxmlUri, (current) => current.length === 0);
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    assert.deepStrictEqual(await diagnosticsReady, []);
  });
});
