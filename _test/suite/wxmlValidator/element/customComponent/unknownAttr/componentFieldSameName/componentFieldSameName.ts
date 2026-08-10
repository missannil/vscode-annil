import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({
  data: {
    subGoods: {},
  },
});
type Root = typeof rootComponent;

// 组件名 subInline 与字段 subInline__subInline 重名（双下划线 → 对外 _subInline）
const subInline = CustomComponent<Root, $SubInline>()({
  // @ts-expect-error fixture only needs a subset of $SubInline fields
  inherit: { subInline__subInline: "subGoods" },
});

// @ts-expect-error fixture only needs a subset of $SubInline fields
DefineComponent({ name: "componentFieldSameName", rootComponent, subComponents: [subInline] });
