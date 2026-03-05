import type { Attrib, BaseContent, FileName, TagInfo } from "./types";
import { capitalize, indent, kebabToCamel } from "./utils";

export function addAttribValidateInfo(
  index: number,
  fileName: FileName,
  attrib: Attrib,
  tagInfo: TagInfo,
  context: BaseContent,
): void {
  const { isRoot, element: { attribs, name } } = tagInfo;
  const eleId = isRoot ? fileName : attribs["id"];
  const camelCase = kebabToCamel(attrib);
  context.componentInfo.push(`${indent}${eleId}_${camelCase}: str`);
  // context.partialValidateInfo.push(`${indent}${eleId}_${camelCase}: str`);
  if (isRoot) {
    // 根节点的属性直接生成获取属性的方法
    context.testClass.push(
      `${indent}def get${capitalize(camelCase)}(self) -> str:`,
      `${indent}${indent}return self.element.attribute("${attrib}")[0]`,
    );

    return;
  }
  // 如果是仅tiao'jian
  if (index === 0) {
    // 如果是第一个属性，生成获取元素的方法，后续属性只生成获取属性的方法，避免重复获取元素
    context.testClass.push(
      `${indent}def getElementOf${capitalize(eleId)}(self) -> BaseElement:`,
      `${indent}${indent}return self.element.get_element("${name}[id$='${eleId}']")`,
    );
  }
  context.testClass.push(
    `${indent}def get${capitalize(eleId)}${capitalize(camelCase)}(self) -> str:`,
    `${indent}${indent}return self.getElementOf${capitalize(eleId)}().attribute("${attrib}")[0]`,
  );
}
//
/**
 * 约定写法，条件或循环的block下只允许有一个元素节点。
 * 自定义组件背部元素的block状态
 * 1.根元素不受约束(因为判断和判断都应该独立与自定义组件外部）
 * 2.仅条件block元素 是一个元素 且 应该加入存在与否的验证规则
 * 3.仅循环block元素 是一个列表 如果其中有条件block元素 通过数量(和兄弟元素)来判断是否存在。
 * 4.条件且循环block元素
 */
