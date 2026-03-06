import type * as Domhandler from "domhandler";
import * as fs from "fs";
import * as htmlparser2 from "htmlparser2";
import * as jsonc from "jsonc-parser";
import * as path from "path";
import * as vscode from "vscode";
type PlainObject = Record<string, unknown>;

export { type Domhandler, fs, htmlparser2, jsonc, path, PlainObject, vscode };
