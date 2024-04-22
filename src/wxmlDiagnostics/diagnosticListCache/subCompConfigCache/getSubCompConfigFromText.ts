import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import type { AttributeConfig, SubCompConfig } from ".";
// 只取这几个字段的属性。
const validFields = ["events", "computed", "store", "data", "inherit"];

// 提取组件ts文件中的各个子组件(SubComponent函数建立的)的属性配置信息。
export function getSubCompConfigFromText(tsText: string): SubCompConfig {
  const tsFileAST = parse(tsText, { sourceType: "module", plugins: ["typescript"] });
  // 对象key为组件名,值为组件的属性,要传递的属性以字符串的形式存储
  const allSubCompAttrs: SubCompConfig = {};
  traverse(tsFileAST, {
    VariableDeclarator(path) {
      // @ts-ignore 判断当前节点是否是由SubComponent函数生成
      if (path.node.init?.callee?.callee?.name === "SubComponent") {
        const subCompName = (path.node.id as any).name;
        allSubCompAttrs[subCompName] = {};
        const subCompAttrs: AttributeConfig = allSubCompAttrs[subCompName];
        // 因为就一个参数,所以直接取第一个 arguments[0]即可,properties为配置对象的第一层配置字段 inherit data store computed watch methods evnets lifetimes等
        (path.node.init as any).arguments[0].properties.forEach(
          // firstLevelField 为 inherit data store computed evnets methods watch等字段
          (firstLevelField: any) => {
            // 如果不是有效字段,则不需要加入到属性中。
            if (!validFields.includes(firstLevelField.key.name)) return;
            // 第一层级字段的值即进入第二层级的配置,再次遍历 即得到有效字段的配置(值)
            firstLevelField.value.properties.forEach(
              (secondLevelField: any) => {
                // secondLevelFieldName为第二层级的配置字段名
                const secondLevelFieldName = secondLevelField.key.name;
                // 如果是以_开头的字段,则不需要处理,这些是定义的内部字段。
                if (secondLevelFieldName.startsWith("_")) {
                  return;
                }
                // 不是以_开头的字段,则需要处理,因为这是要传递给组件的属性
                const regex = /_(.*)/; // 以第一个_开头的字符串，这是要传递的真实属性
                // 去除前缀后的字段是传递给组件的真实属性
                const realAttr = secondLevelFieldName.match(regex)[1];
                switch (firstLevelField.key.name) {
                  // inherit传递规则与其他字段不同,所以单独处理
                  case "inherit":
                    // inherit字段的属性值有可能是数组或字符串
                    subCompAttrs[realAttr] = secondLevelField.value.type === "ArrayExpression" ? secondLevelField.value.elements.map((el: any) => el.value) : secondLevelField.value.value;
                    break;
                  case "events":
                    // 事件字段名根据后缀来处理,不是catch后缀用bind:否则用catch:
                    {
                      if (secondLevelFieldName.endsWith("_catch")) {
                        subCompAttrs[
                          // 去除realAttr 后六位 (即"_catch")的字段名
                          `catch:${realAttr.slice(0, -6)}`
                        ] = `${secondLevelFieldName}`;
                      } else {
                        subCompAttrs[
                          `bind:${realAttr}`
                        ] = `${secondLevelFieldName}`;
                      }
                    }
                    break;
                  default:
                    // 其他字段的传递的属性值就是字段名
                    subCompAttrs[realAttr] = secondLevelFieldName;
                }
              },
            );
          },
        );
      }
    },
  });

  return allSubCompAttrs;
}
