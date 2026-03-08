import type { Attrib, BaseContent, BlockType, FileName, TagInfo } from "./types";
import {
  capitalize,
  indent,
  isConditionalElement,
  isDataAttrib,
  isEventAttrib,
  isLoopElement,
  isNormalAttrib,
  isValidAttrib,
  kebabToCamel,
} from "./utils";

/**
 * 加上_开头为了避免相同的id后缀导致冲突
 * @param id
 * @returns
 */
function getElementId(id: string): string {
  if (id.includes("_")) {
    // 以最后一个下划线分割，取最后一部分作为id
    return "_" + id.split("_").slice(-1)[0];
  }

  return id;
}

function handleNormalAndDataAttrib(
  fileName: string,
  isRoot: boolean,
  blockType: BlockType[],
  elementId: string,
  attrib: string,
  context: BaseContent,
  getComopnentInfo: string[],
): void {
  if (isRoot) {
    context.componentInfo.splice(-2, 0, `${indent}${indent}"${fileName}_${attrib}": str,`);
    context.partialComponentInfo.splice(-3, 0, `${indent}${indent}"${fileName}_${attrib}": str,`);
    context.testClass.push(
      `${indent}def get${capitalize(kebabToCamel(attrib))}(self) -> str:`,
      `${indent}${indent}return self.element.attribute("${attrib}")[0]`,
    );
    getComopnentInfo.splice(
      -1,
      0,
      `${indent}${indent}${indent}"${fileName}_${attrib}": self.get${capitalize(kebabToCamel(attrib))}(),`,
    );
  } else if (isLoopElement(blockType)) {
    context.componentInfo.splice(-2, 0, `${indent}${indent}"${elementId}_${attrib}List": List[str],`);
    context.partialComponentInfo.splice(-3, 0, `${indent}${indent}"${elementId}_${attrib}List": List[str],`);
    context.testClass.push(
      `${indent}def get${capitalize(kebabToCamel(attrib))}Of${capitalize(elementId)}(self) -> List[str]:`,
      `${indent}${indent}return [element.attribute("${attrib}")[0] for element in self.getElementsOf${
        capitalize(elementId)
      }()]`,
    );
    getComopnentInfo.splice(
      -1,
      0,
      `${indent}${indent}${indent}"${elementId}_${attrib}List": self.get${capitalize(kebabToCamel(attrib))}Of${
        capitalize(elementId)
      }(),`,
    );
  } else if (isConditionalElement(blockType)) {
    context.componentInfo.splice(-2, 0, `${indent}${indent}"${elementId}_${attrib}": str | None,`);
    context.partialComponentInfo.splice(-3, 0, `${indent}${indent}"${elementId}_${attrib}": str | None,`);
    context.testClass.push(
      `${indent}def get${capitalize(kebabToCamel(attrib))}Of${capitalize(elementId)}(self) -> str | None:`,
      `${indent}${indent}element = self.getElementOf${capitalize(elementId)}()`,
      `${indent}${indent}if element:`,
      `${indent}${indent}${indent}return element.attribute("${attrib}")[0]`,
      `${indent}${indent}else:`,
      `${indent}${indent}${indent}return None`,
    );
    getComopnentInfo.splice(
      -1,
      0,
      `${indent}${indent}${indent}"${elementId}_${attrib}": self.get${capitalize(kebabToCamel(attrib))}Of${
        capitalize(elementId)
      }(),`,
    );
  } else {
    context.componentInfo.splice(-2, 0, `${indent}${indent}"${elementId}_${attrib}": str,`);
    context.partialComponentInfo.splice(-3, 0, `${indent}${indent}"${elementId}_${attrib}": str,`);
    context.testClass.push(
      `${indent}def get${capitalize(kebabToCamel(attrib))}Of${capitalize(elementId)}(self) -> str:`,
      `${indent}${indent}return self.getElementOf${capitalize(elementId)}().attribute("${attrib}")[0]`,
    );
    getComopnentInfo.splice(
      -1,
      0,
      `${indent}${indent}${indent}"${elementId}_${attrib}": self.get${capitalize(kebabToCamel(attrib))}Of${
        capitalize(elementId)
      }(),`,
    );
  }
}

function handleEventAttribForNonRootElement(
  fileName: string,
  isRoot: boolean,
  blockType: BlockType[],
  elementId: string,
  attrib: string,
  context: BaseContent,
): void {
  if (isRoot) {
    context.testClass.push(
      `${indent}def tap${capitalize(fileName)}(self, count: int = 1) -> None:`,
      `${indent}${indent}self.tapElement(self.element, count)`,
    );
  } else if (isLoopElement(blockType)) {
    // 由于wxFor标签的元素有多个，先获取对应索引的元素,如果存在再执行点击操作,不存在报错
    context.testClass.push(
      `${indent}def tap${capitalize(elementId)}(self,index: int, count: int = 1) -> None:`,
      `${indent}${indent}elementList = self.getElementsOf${capitalize(elementId)}()`,
      `${indent}${indent}if index < len(elementList):`,
      `${indent}${indent}${indent}element = elementList[index]`,
      `${indent}${indent}${indent}self.tapElement(element, count)`,
      `${indent}${indent}else:`,
      `${indent}${indent}${indent}raise Exception("Element not found")`,
    );
  } else if (isConditionalElement(blockType)) {
    // 由于wxIf标签的元素可能不存在，所以先获取元素再判断是否存在,如果存在再执行点击操作,不存在报错
    context.testClass.push(
      `${indent}def tap${capitalize(elementId)}(self, count: int = 1) -> None:`,
      `${indent}${indent}element = self.getElementOf${capitalize(elementId)}()`,
      `${indent}${indent}if element:`,
      `${indent}${indent}${indent}self.tapElement(element, count)`,
      `${indent}${indent}else:`,
      `${indent}${indent}${indent}raise Exception("Element not found")`,
    );
  } else {
    // 普通元素直接生成点击方法
    context.testClass.push(
      `${indent}def tap${capitalize(elementId)}(self, count: int = 1) -> None:`,
      `${indent}${indent}self.tapElement(self.getElementOf${capitalize(elementId)}(), count)`,
    );
  }
}

function appendInnerTextHandling(
  fileName: FileName,
  isRoot: boolean,
  blockType: BlockType[],
  elementId: string,
  context: BaseContent,
  getComopnentInfo: string[],
): void {
  if (isRoot) {
    context.componentInfo.splice(-2, 0, `${indent}${indent}"${fileName}_innerText": str,`);
    context.partialComponentInfo.splice(-3, 0, `${indent}${indent}"${fileName}_innerText": str,`);
    context.testClass.push(
      `${indent}def getInnerText(self) -> str:`,
      `${indent}${indent}return self.element.inner_text`,
    );
    getComopnentInfo.splice(
      -1,
      0,
      `${indent}${indent}${indent}"${fileName}_innerText": self.getInnerText(),`,
    );

    return;
  }

  if (isLoopElement(blockType)) {
    context.componentInfo.splice(-2, 0, `${indent}${indent}"${elementId}_innerTextList": List[str],`);
    context.partialComponentInfo.splice(-3, 0, `${indent}${indent}"${elementId}_innerTextList": List[str],`);
    context.testClass.push(
      `${indent}def getInnerTextListOf${capitalize(elementId)}(self) -> List[str]:`,
      `${indent}${indent}return [element.inner_text for element in self.getElementsOf${capitalize(elementId)}()]`,
    );
    getComopnentInfo.splice(
      -1,
      0,
      `${indent}${indent}${indent}"${elementId}_innerTextList": self.getInnerTextListOf${capitalize(elementId)}(),`,
    );

    return;
  }

  if (isConditionalElement(blockType)) {
    context.componentInfo.splice(-2, 0, `${indent}${indent}"${elementId}_innerText": str | None,`);
    context.partialComponentInfo.splice(-3, 0, `${indent}${indent}"${elementId}_innerText": str | None,`);
    context.testClass.push(
      `${indent}def getInnerTextOf${capitalize(elementId)}(self) -> str | None:`,
      `${indent}${indent}element = self.getElementOf${capitalize(elementId)}()`,
      `${indent}${indent}if element:`,
      `${indent}${indent}${indent}return element.inner_text`,
      `${indent}${indent}else:`,
      `${indent}${indent}${indent}return None`,
    );
    getComopnentInfo.splice(
      -1,
      0,
      `${indent}${indent}${indent}"${elementId}_innerText": self.getInnerTextOf${capitalize(elementId)}(),`,
    );

    return;
  }

  context.componentInfo.splice(-2, 0, `${indent}${indent}"${elementId}_innerText": str,`);
  context.partialComponentInfo.splice(-3, 0, `${indent}${indent}"${elementId}_innerText": str,`);
  context.testClass.push(
    `${indent}def getInnerTextOf${capitalize(elementId)}(self) -> str:`,
    `${indent}${indent}return self.getElementOf${capitalize(elementId)}().inner_text`,
  );
  getComopnentInfo.splice(
    -1,
    0,
    `${indent}${indent}${indent}"${elementId}_innerText": self.getInnerTextOf${capitalize(elementId)}(),`,
  );
}

export function handleNativeTag(
  fileName: FileName,
  tagInfo: TagInfo,
  context: BaseContent,
  getComopnentInfo: string[],
): void {
  const { element, blockType, isRoot, hasInnerText } = tagInfo;
  const elementId = getElementId(element.attribs.id);
  const tagName = element.tagName;
  const validAttribs = (Object.keys(element.attribs) as Attrib[]).filter(isValidAttrib);
  if (isRoot) {
    context.testClass.push(
      `${indent}def __init__(self, element: BaseElement | None = None) -> None:`,
      `${indent}${indent}super().__init__()`,
      `${indent}${indent}if element is None:`,
      `${indent}${indent}${indent}self.element = self.page.get_element("${tagName}[id$='${fileName}']")`,
      `${indent}${indent}else:`,
      `${indent}${indent}${indent}self.element = element`,
    );
  } else if (isLoopElement(blockType)) {
    context.testClass.push(
      `${indent}def getElementsOf${capitalize(elementId)}(self) -> List[BaseElement]:`,
      `${indent}${indent}return self.element.get_elements("${tagName}[id$='${elementId}']")`,
    );
  } else if (isConditionalElement(blockType)) {
    context.testClass.push(
      `${indent}def getElementOf${capitalize(elementId)}(self) -> BaseElement | None:`,
      `${indent}${indent}try:`,
      `${indent}${indent}${indent}return self.element.get_element("${tagName}[id$='${elementId}']")`,
      `${indent}${indent}except Exception:`,
      `${indent}${indent}${indent}return None`,
    );
  } else {
    context.testClass.push(
      `${indent}def getElementOf${capitalize(elementId)}(self) -> BaseElement:`,
      `${indent}${indent}return self.element.get_element("${tagName}[id$='${elementId}']")`,
    );
  }

  validAttribs.forEach((attrib) => {
    if (isNormalAttrib(attrib) || isDataAttrib(attrib)) {
      handleNormalAndDataAttrib(fileName, isRoot, blockType, elementId, attrib, context, getComopnentInfo);
    } else if (isEventAttrib(attrib)) {
      handleEventAttribForNonRootElement(fileName, isRoot, blockType, elementId, attrib, context);
    }
  });
  if (hasInnerText) {
    appendInnerTextHandling(fileName, isRoot, blockType, elementId, context, getComopnentInfo);
  }
}
