// ── Node.js 内置 ──
import * as assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// ── npm 依赖 ──
import { type Options, parseDocument } from "htmlparser2";
import * as jsonc from "jsonc-parser";
import * as vscode from "vscode";

// ── 类型重新导出 ──
export type * as Domhandler from "domhandler";

// ── 值导出 ──
export { assert, fileURLToPath, fs, jsonc, parseDocument, path, process, vscode };

// ── 类型导出 ──
export type { Options };
