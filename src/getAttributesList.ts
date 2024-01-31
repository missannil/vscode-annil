import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import { INHERITWXML, WXML } from "./constant";

type Attributes = Record<string, string>;

export type AttributesList = Record<string, Attributes>;
/**
 * 获取组件ts文件中的各个子组件(SubComponent建立的)的配置属性。
 * @param tsContentStr 文件 string
 */
export async function getAttributesList(tsContentStr: string): Promise<AttributesList | null> {
  // 转换为AST 记得配置 plugins: ["typescript"]
  const tsContentAST = parse(tsContentStr, {
    sourceType: "module",
    plugins: ["typescript"],
  });
  // 对象key为组件名,值为组件的属性,要传递的属性以字符串的形式存储
  const attributesList: AttributesList = {};

  // 遍历AST 获取由SubComponent函数生成的变量名的对象
  traverse(tsContentAST, {
    VariableDeclarator(path) {
      // @ts-ignore 判断当前节点是否是由SubComponent函数生成
      if (path.node.init?.callee?.callee?.name === "SubComponent") {
        // 建立对应组件名的属性列表,无配置可能为空数组
        const attributes: Attributes = (attributesList[
          (path.node.id as any).name
        ] = {});

        // 因为就一个参数,所以直接取第一个 arguments[0]即可,properties为配置对象的第一层配置字段 inherit data store computed watch methods evnets等
        (path.node.init as any).arguments[0].properties.forEach(
          // firstLevelField 为 inherit data store computed watch methods evnets等
          (firstLevelField: any) => {
            // // propertyItem为配置对象的每一项
            // // 获取每一项配置的key name
            // const firstLevelFieldName = firstLevelField.key.name;
            // 第一层级字段的值即进入第二层级的配置,再次遍历 即得到 inherit data store computed等的配置字段
            firstLevelField.value.properties.forEach(
              (secondLevelField: any) => {
                // secondLevelFieldName为第二层级的配置字段名
                const secondLevelFieldName = secondLevelField.key.name;
                // 如果是以_开头的字段,则不需要加入到属性中,因为这是定义的内部字段。
                if (secondLevelFieldName.startsWith("_")) {
                  return;
                }
                // 不是以_开头的字段,则需要加入到属性中,因为这是要传递给组件的属性
                const regex = /_(.*)/; // 以第一个_开头的字符串，这是要传递的真实属性
                // 去除_后的字段名是传递给组件的真实属性
                const realAttr = secondLevelFieldName.match(regex)[1];

                // 因为inherit传递规则与其他字段不同,所以单独处理
                switch (firstLevelField.key.name) {
                  // inherit 的value是具体的字段,这里没有区分值为'wxml'的情况.
                  case "inherit":
                    if (secondLevelField.value.value === WXML) {
                      attributes[realAttr] = INHERITWXML;
                    } else {
                      attributes[realAttr] = `{{${secondLevelField.value.value}}}`;
                    }

                    break;
                  case "events":
                    // 事件字段名根据后缀来处理,不是catch后缀用bind:否则用catch:
                    {
                      if (secondLevelFieldName.endsWith("_catch")) {
                        attributes[
                          `catch:${realAttr.slice(0, -6)}` // 去除realAttr 后六位 (_catch)
                        ] = `${secondLevelFieldName}`;
                      } else {
                        attributes[
                          `bind:${realAttr}`
                        ] = `${secondLevelFieldName}`;
                      }
                    }

                    break;
                  default:
                    // 其他字段的传递的属性就是字段名
                    attributes[realAttr] = `{{${secondLevelFieldName}}}`;
                }
              },
            );
          },
        );
      }
    },
  });

  if (Object.keys(attributesList).length === 0) {
    return null;
  }

  return attributesList;
}
