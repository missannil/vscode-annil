import * as fs from "fs";
import * as jsonc from "jsonc-parser";

import * as path from "path";
import * as vscode from "vscode";
type PlainObject = Record<string, unknown>;

export { fs, jsonc, path, PlainObject, vscode };
