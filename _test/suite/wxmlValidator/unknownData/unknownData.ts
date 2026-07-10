import { DefineComponent, RootComponent, SubComponent } from "annil";
import type { ComponentDoc } from "annil/dist/api/DefineComponent/returnType/ComponentDoc.js";
import type { $SubExternal } from "~/subExternal/subExternal.js";

type $ChunkA = ComponentDoc<{
  properties: {
    chunkA_useInherit: string;
  };
}>;

// 对于非独立声明在一个文件目录下的组件(临时自定义组件),在wxml中用id属性对应。可通过 inherit 显式继承父组件的对应数据。否则，wxml 中访问父组件的非内部数据会报错。
const chunkA = SubComponent<Root, $ChunkA>()({
  inherit: {
    chunkA_useInherit: "knownData",
  },
});
// SubComponent中的非内部数据只能被wxml中对应的自定义组件访问。
const subExternal = SubComponent<Root, $SubExternal>()({
  data: {
    subExternal_str: "hello",
    _subExternal_innerStr: "internal",
  },
});

//  RootComponent中的非内部数据可以被wxml中非自定义组件访问，内部数据不能被访问。
const rootComponent = RootComponent()({
  properties: {
    cid: {
      type: String,
      value: "root",
    },
  },
  data: {
    knownData: "hello",
    _innerData: "internal",
  },
});

export type Root = typeof rootComponent;

DefineComponent({
  name: "unknownData",
  rootComponent,
  subComponents: [subExternal, chunkA],
});
