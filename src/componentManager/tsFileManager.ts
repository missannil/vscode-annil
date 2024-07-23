/* eslint-disable complexity */
import { parse } from "@babel/parser";
import traverse, { type Node } from "@babel/traverse";
import type { ArrowFunctionExpression, Identifier, ObjectMethod } from "@babel/types";
import * as vscode from "vscode";
import { assertNonNullable } from "../utils/assertNonNullable";
const config: AppJsonConfig = require("../../app.json");
type AttrName = string;
type Prefix = `${string}_`;
type Rename = string;
type ImportName = string;
type ImportPath = string;

export type ImportInfo = Record<ImportName, ImportPath>;

export type WxForDefault = "item" | "index";
type WxForValue =
  | `${WxForDefault}:`
  | `${WxForDefault}:${Rename}`
  | `${Prefix}${WxForDefault}:`
  | `${Prefix}${WxForDefault}:${Rename}`;

export type WxFor = {
  type: "WxFor";
  value: WxForValue;
};

export type WxForValueInfo = {
  pre: string;
  type: WxForDefault;
  rename: Rename;
};

// 当前annil插件中,表达自定义值时,使用wxml作为标记。
export const WXML = "wxml";

export const CUSTOM = "自定义";

// export type Ternary = { type: "Ternary"; value: string[] };
export type Custom = { type: "Custom"; value: typeof CUSTOM };
type Root = { type: "Root"; value: string };

// export type InheritValue = WxFor | Ternary | Custom | RootData;
export type Inherit = Custom | Root;

export type Events = { type: "Events"; value: string };

export type Self = { type: "Self"; value: string };

export type AttrValue = Inherit | Events | Self;

export type AttrConfig = Record<AttrName, AttrValue>;
type SubCompName = string;

export type SubComponentInfo = Record<SubCompName, AttrConfig | undefined>;

export type RootComponentInfo = { arrTypeData: string[]; dataList: string[]; events: string[] };

export type TsFileInfo = {
  subComponentInfo: SubComponentInfo;
  rootComponentInfo: RootComponentInfo;
  importedSubCompInfo: ImportInfo;
};

export function parseWxForValue(wxForValue: WxFor): WxForValueInfo {
  const preTypeAndRename = wxForValue.value.split(":");
  const rename = preTypeAndRename[1];
  const preAndType = preTypeAndRename[0].split("_");
  let pre = "";
  let type: WxForDefault;
  if (preAndType.length === 2) {
    type = preAndType[1] as WxForDefault;
    pre = `${preAndType[0]}_`;
  } else {
    type = preAndType[0] as WxForDefault;
  }

  return {
    pre,
    type,
    rename,
  };
}

function isArraySingleType(node: Node): boolean {
  // 例如 `{ xxx: Array}` 时(后面没有as 类型的情况 )
  return node.type === "Identifier" && node.name === "Array";
}

function isTsArraySingleType(node: Node): boolean {
  // 例如 `{ xxx: Array as DetailedType<UserList> }` 时
  return node.type === "TSAsExpression" && isArraySingleType(node.expression);
}

/**
 * 判断是否是对象配置的数组类型
 * 例如:
 * ```ts
 *  {
      type: Array // or  as DetailedType<ProductList>,
      value: [{ name: "apple", price: 10 }, { name: "banana", price: 30}],
    },
    ```
 */
function isFullConfigOfArrayType(node: Node): boolean {
  if (node.type === "ObjectExpression") {
    const typeFieldConfig = (node.properties[0] as any).value as Node;

    return isArraySingleType(typeFieldConfig) || isTsArraySingleType(typeFieldConfig);
  }

  return false;
}

function isArrayTypeOfPropertiesFields(node: Node): boolean {
  return isArraySingleType(node) || isTsArraySingleType(node) || isFullConfigOfArrayType(node);
}

function isArrayTypeFunction(node: Node): boolean {
  if (
    (node.type === "ObjectMethod" || node.type === "ArrowFunctionExpression") && node.returnType
    && node.returnType.type === "TSTypeAnnotation"
    && node.returnType.typeAnnotation.type === "TSArrayType"
  ) {
    return true;
  }

  return false;
}

function isNormalAttrType(node: Node): boolean {
  return node.type === "ArrayExpression"
    || node.type === "TSAsExpression" && node.typeAnnotation.type === "TSArrayType";
}

export function isEventsValue(attrValue: AttrValue): attrValue is Events {
  return attrValue.type === "Events";
}

export function isCustomValue(attrValue: AttrValue): attrValue is Custom {
  return attrValue.type === "Custom";
}

export function isRootValue(attrValue: AttrValue): attrValue is Root {
  return attrValue.type === "Root";
}

export function isSelfValue(attrValue: AttrValue): attrValue is Self {
  return attrValue.type === "Self";
}
// type ArrayExpression = { type: "ArrayExpression"; elements: StringLiteral[] };
type StringLiteral = { type: "StringLiteral"; value: string };

function isIdentifier(node: Node): node is Identifier {
  return node.type === "Identifier";
}

function isStringLiteral(node: Node): node is StringLiteral {
  return node.type === "StringLiteral";
}

function getInheritValue(valueElement: StringLiteral | Identifier): Custom | Root {
  if (
    isStringLiteral(valueElement) && valueElement.value === WXML
    || isIdentifier(valueElement) && valueElement.name === "WXML"
  ) {
    // 如果是wxml字符串或者是WXML变量,则表示自定义值
    return { type: "Custom", value: CUSTOM } satisfies Custom;
  }
  if (isStringLiteral(valueElement)) {
    return { type: "Root", value: valueElement.value } satisfies Root;
  }
  throw Error("不应出现的错误:getInheritValue");
}

// 首字母大写
function capitalizeFirstLetter(str: string): string {
  if (!str) return str;

  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 首字母小写
function decapitalizeFirstLetter(str: string): string {
  if (!str) return str;

  return str.charAt(0).toLowerCase() + str.slice(1);
}

function removeDollarPrefix(str: string): string {
  return str.startsWith("$") ? str.slice(1) : str;
}

function getSubCompName(baseName: string, extensionName: string | undefined): string {
  baseName = decapitalizeFirstLetter(removeDollarPrefix(baseName));

  return extensionName === undefined ? baseName : `${baseName}${capitalizeFirstLetter(extensionName)}`;
}
type AppJsonConfig = {
  resolveAlias: Record<string, string>;
};

// 从长到短匹配别名,并替换路径
function parseAlias(importPath: string): string {
  const pathArr = importPath.split("/");
  // 从整个路径开始匹配，逐渐减少路径的部分
  for (let i = pathArr.length; i > 0; i--) {
    const currentPathParts = pathArr.slice(0, i);
    const currentPath = currentPathParts.join("/") + "/";
    const configPath: string | undefined = config.resolveAlias[`${currentPath}*`];
    if (configPath !== undefined) {
      // 替换匹配的路径部分 slice(0,-1)是为了去掉最后的 * 号(约定配置最后都有一个 * 号)
      const path = importPath.replace(currentPath, configPath.slice(0, -1));

      return path.startsWith("/") ? path : "/" + path;
    }
  }

  // 如果没有找到匹配项，返回原始路径
  return importPath;
}

function getImportedSubCompInfo(baseCompTypes: string[], importInfo: ImportInfo): ImportInfo {
  const importedSubCompInfo: ImportInfo = {};
  for (const [importName, importPath] of Object.entries(importInfo)) {
    if (baseCompTypes.includes(importName)) {
      importedSubCompInfo[decapitalizeFirstLetter(removeDollarPrefix(importName))] = parseAlias(importPath);
    }
  }

  return importedSubCompInfo;
}
const subComponentExtractedFields = ["inherit", "data", "computed", "store", "events"];
const rootComponentExtractedFields = ["properties", "data", "computed", "store", "events"];

// 提取组件ts文件中的各个子组件(SubComponent函数建立的)的属性配置信息。
export function tsFileParser(tsText: string): TsFileInfo {
  const tsFileAST = parse(tsText, { sourceType: "module", plugins: ["typescript"] });
  const tsFileInfo: TsFileInfo = {
    subComponentInfo: {},
    rootComponentInfo: { arrTypeData: [], dataList: [], events: [] },
    importedSubCompInfo: {},
  };
  // 对象key为组件名,值为组件的属性,要传递的属性以字符串的形式存储
  const subComponentInfo = tsFileInfo.subComponentInfo;
  const rootComponentInfo = tsFileInfo.rootComponentInfo;
  const baseCompTypes: string[] = [];
  const importInfo: ImportInfo = {};
  traverse(tsFileAST, {
    VariableDeclarator(path) {
      const expression = path.node.init as any;
      const funcName = expression?.callee?.callee?.name;
      // 提取所有SubComponent函数中的数据和事件
      if (funcName === "SubComponent") {
        // 导入的子组件类型名
        const baseCompName = (expression as any).callee?.typeParameters?.params[1]?.typeName?.name;
        const extensionName = (expression as any).callee?.typeParameters?.params[2]?.literal?.extra?.rawValue;
        if (baseCompName === undefined) return; // 避免没有写泛型时报错
        baseCompTypes.push(baseCompName);
        const subCompName = getSubCompName(baseCompName, extensionName);
        // const subCompName = (path.node.id as any).name;
        subComponentInfo[subCompName] = {};
        // const subCompAttrs: AttrConfig = assertNonNullable(subComponentInfo[subCompName]);
        const subCompAttrs: AttrConfig = subComponentInfo[subCompName];
        // 因为就一个参数,所以直接取第一个 arguments[0]即可,properties为配置对象的第一层配置字段 inherit data store computed watch methods evnets lifetimes等
        (expression as any).arguments[0].properties.forEach(
          // firstLevelField 为 inherit data store computed evnets methods watch等字段
          (firstLevelField: any) => {
            // 如果不是有效字段,则不需要加入到属性中。
            if (!subComponentExtractedFields.includes(firstLevelField.key.name)) return;
            // 第一层级字段的值即进入第二层级的配置,再次遍历 即得到有效字段的配置(值)
            firstLevelField.value.properties.forEach(
              (secondLevelField: any) => {
                // secondLevelFieldName为第二层级的配置字段名
                const secondLevelFieldName = secondLevelField.key.name as string;
                // 如果是以_开头的字段,则不需要处理,这些是定义的内部字段。
                if (secondLevelFieldName.startsWith("_")) {
                  return;
                }
                // 不是以_开头的字段,则需要处理,因为这是要传递给组件的属性
                const regex = /[^_]*_(.*)/; // 以第一个_开头的字符串，这是要传递的真实属性
                // 去除前缀后的字段是传递给组件的真实属性
                const realAttr = assertNonNullable(secondLevelFieldName.match(regex))[1];
                switch (firstLevelField.key.name) {
                  // inherit传递规则与其他字段不同,所以单独处理
                  case "inherit":
                    // inherit字段的属性值有可能是数组或字符串或wxFor中的值(value中带有:的值)
                    subCompAttrs[realAttr] = getInheritValue(secondLevelField.value);
                    break;
                  case "events":
                    // 事件字段名根据后缀来处理,不是catch后缀用bind:否则用catch:
                    {
                      if (secondLevelFieldName.endsWith("_catch")) {
                        subCompAttrs[
                          // 去除realAttr 后六位 (即"_catch")的字段名
                          `catch:${realAttr.slice(0, -6)}`
                        ] = { type: "Events", value: `${secondLevelFieldName}` } satisfies Events;
                      } else {
                        subCompAttrs[
                          `bind:${realAttr}`
                        ] = { type: "Events", value: `${secondLevelFieldName}` } satisfies Events;
                      }
                    }
                    break;
                  default:
                    // 其他字段的传递的属性值就是字段名 dataFields
                    subCompAttrs[realAttr] = { type: "Self", value: secondLevelFieldName };
                }
              },
            );
          },
        );
      }
      // @ts-ignore 提取RootComponent函数中数据和事件
      if (funcName === "RootComponent") {
        (expression as any).arguments[0].properties.forEach(
          (firstLevelField: any) => {
            const firstLevelAttrName = firstLevelField.key.name;
            if (!rootComponentExtractedFields.includes(firstLevelAttrName)) return;
            // 第一层级字段的值即进入第二层级的配置,再次遍历 即得到有效字段的配置(值)
            firstLevelField.value.properties.forEach(
              (secondLevelField: any) => {
                // secondLevelFieldName有可能为 properties data computed store events了
                const secondLevelFieldName: string = secondLevelField.key.name;
                // 如果是以_开头的字段,则不需要处理,这些是定义的内部字段。
                if (secondLevelFieldName.startsWith("_")) {
                  return;
                }
                switch (firstLevelAttrName) {
                  case "events":
                    rootComponentInfo.events.push(secondLevelFieldName);
                    break;
                  case "properties":
                    {
                      if (isArrayTypeOfPropertiesFields(secondLevelField.value)) {
                        rootComponentInfo.arrTypeData.push(secondLevelFieldName);
                      }
                      rootComponentInfo.dataList.push(secondLevelFieldName);
                    }
                    break;
                  case "computed":
                    if (isArrayTypeFunction(secondLevelField as ObjectMethod)) {
                      rootComponentInfo.arrTypeData.push(secondLevelFieldName);
                    }
                    rootComponentInfo.dataList.push(secondLevelFieldName);
                    break;
                  case "store":
                    {
                      if (isArrayTypeFunction(secondLevelField.value as ArrowFunctionExpression)) {
                        rootComponentInfo.arrTypeData.push(secondLevelFieldName);
                      }
                      rootComponentInfo.dataList.push(secondLevelFieldName);
                    }
                    break;
                  case "data":
                    {
                      if (isNormalAttrType(secondLevelField.value)) {
                        rootComponentInfo.arrTypeData.push(secondLevelFieldName);
                      }
                      rootComponentInfo.dataList.push(secondLevelFieldName);
                    }
                    break;
                }
              },
            );
          },
        );
      }
    },
    ImportDeclaration(path) {
      // 检查整个导入声明是否为类型导入
      if (path.node.importKind === "type") {
        path.node.specifiers.forEach((specifier) => {
          importInfo[specifier.local.name] = path.node.source.value;
        });
      } else {
        // 对于非整体类型导入，检查每个 specifier 是否为类型导入
        path.node.specifiers.forEach((specifier) => {
          if (specifier.type === "ImportSpecifier" && specifier.importKind === "type") {
            importInfo[specifier.local.name] = path.node.source.value;
          }
        });
      }
    },
  });
  tsFileInfo.importedSubCompInfo = getImportedSubCompInfo([...new Set(baseCompTypes)], importInfo);

  return tsFileInfo;
}
type TsFileFsPath = string;
class TsFile {
  private infoCache: Record<TsFileFsPath, TsFileInfo | undefined> = {};
  public async get(fsPath: TsFileFsPath): Promise<TsFileInfo> {
    const fileInfo = this.infoCache[fsPath];
    if (!fileInfo) {
      await this.update(fsPath);
    } else {
      return fileInfo;
    }

    return this.get(fsPath);
  }
  public async update(fsPath: TsFileFsPath, text?: string): Promise<void> {
    if (text === undefined) {
      text = (await vscode.workspace.openTextDocument(fsPath)).getText();
    }
    this.infoCache[fsPath] = tsFileParser(text);
    // console.log(this.infoCache[fsPath]?.rootComponentInfo);
  }
}

export const tsFileManager = new TsFile();
