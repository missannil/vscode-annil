import * as vscode from "vscode";
// id检测规则没有想好，先不检测
const defualtIgnoreAttrs = ["id"];
const userIgnoreAttrs: string[] = vscode.workspace.getConfiguration("annil").get("ignoreAttrs") || [] ;
// console.log(userIgnoreAttrs, "配置的忽略属性列表");

export const ignoreAttrs: string[] = [...defualtIgnoreAttrs, ...userIgnoreAttrs];
