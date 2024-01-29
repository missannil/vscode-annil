// import type { ChildNode, Document } from "domhandler";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import * as vscode from "vscode";
import { INHERITWXML } from "./constant";
import { AttributesList } from "./getAttributesList";
function getElement(wxmlDocument: Document, tagNameOrId: string): Element | null {
  const elementByTagName = wxmlDocument.getElementsByTagName(tagNameOrId)[0];
  if (elementByTagName) {
    return elementByTagName;
  }

  return wxmlDocument.getElementById(tagNameOrId);
}
/**
 * @param wxmlstr
 * @param attributesList
 * @returns
 */
export function addAttributesToWxmlContentStr(
  wxmlstr: string,
  attributesList: AttributesList,
) {
  // console.log('调用了addAttributesToWxmlContentStr');
  const parser = new DOMParser();
  // 将wxml内容字符串转换为dom对象
  const wxmlDocument = parser.parseFromString(wxmlstr);

  for (const componentName in attributesList) {
    const attributes = attributesList[componentName];
    const element = getElement(wxmlDocument, componentName);
    if (element === null) {
      // wxml中没有对应的组件，不处理
      continue;
    }

    for (const attributeName in attributes) {
      // 拿到wxml的属性值
      const wxmlAttributeValue = element.getAttribute(attributeName);
      // 如果属性值为 INHERITWXML并且wxml中没有该属性，添加空属性,方便后续手写wxml中的属性值。
      if (attributes[attributeName] === INHERITWXML) {
        if (wxmlAttributeValue === "") {
          // console.log("属性值为 INHERITWXML并且wxml中没有该属性，添加空属性,方便后续手写wxml中的属性值。");
          element.setAttribute(attributeName, "{{这还没写}}");
        }
        continue;
      }
      // 如果属性值相同,不处理
      if (wxmlAttributeValue === attributes[attributeName]) {
        continue;
      }
      // 删除原有属性
      // element.removeAttribute(attributeName);
      // 添加新属性
      element.setAttribute(attributeName, attributes[attributeName]);
    }
  }

  const serializer = new XMLSerializer();

  return serializer.serializeToString(wxmlDocument);
}

async function writeFileWxml(wxmlContentStr: string, wxmlFileName: string): Promise<void> {
  return await vscode.workspace.fs.writeFile(
    vscode.Uri.file(wxmlFileName),
    Buffer.from(wxmlContentStr),
  );
}
export async function writeAttributeToWxml(
  wxmlContentStr: string,
  attributesList: AttributesList,
  wxmlFileName: string,
) {
  // wxml文件中加入对应组件的属性,返回新的wxml文件内容(字符串)
  const newWxmlString = addAttributesToWxmlContentStr(
    wxmlContentStr,
    attributesList,
  );

  // 写入.wxml文件
  await writeFileWxml(newWxmlString, wxmlFileName);
}
