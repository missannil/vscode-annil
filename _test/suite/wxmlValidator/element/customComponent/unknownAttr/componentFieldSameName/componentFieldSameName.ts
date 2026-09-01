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
  inherit: { subInline__subInline: "subGoods" },
});

DefineComponent({ name: "componentFieldSameName", rootComponent, subComponents: [subInline] });
