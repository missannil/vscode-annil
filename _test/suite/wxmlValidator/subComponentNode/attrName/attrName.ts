import type { CreateComponentDoc } from "annil";
import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubExternal } from "~/subExternal/subExternal.js";

type $ChunkA = CreateComponentDoc<"chunkA", {
  properties: {
    useInherit: string;
  };
}>;

// 对于非独立声明在一个文件目录下的组件(临时自定义组件),在wxml中用id属性对应。可通过 inherit 显式继承父组件的对应数据。否则，wxml 中访问父组件的非内部数据会报错。
const chunkA = CustomComponent<Root, $ChunkA>()({
  inherit: {
    chunkA_useInherit: "rootData",
  },
});
// CustomComponent中的非内部数据只能被wxml中对应的自定义组件访问。
const subExternal = CustomComponent<Root, $SubExternal>()({
  inherit: {
    subExternal_str: "rootData",
  },
  events: {
    subExternal_onTap() {
      //
    },
  },
});
const subExternal2 = CustomComponent<Root, $SubExternal, "2">()({
  data: {
    subExternal2_str: "subExternal2Str",
  },

  events: {
    subExternal2_onTap() {
      //
    },
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
    rootData: "hello",
    _innerData: "internal",
  },
});

export type Root = typeof rootComponent;

DefineComponent({
  name: "unknownData",
  rootComponent,
  subComponents: [subExternal, subExternal2, chunkA],
});
