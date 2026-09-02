import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({
  data: { list: [] as string[] },
  computed: { activeIndex: () => 0 },
});
type Root = typeof rootComponent;
type TestSubInline = Omit<$SubInline, "properties"> & { properties: Partial<$SubInline["properties"]> };

const subInline = CustomComponent<Root, TestSubInline>()({
  // @ts-expect-error 此字段故意用于覆盖 Custom 属性值诊断。
  inherit: { subInline_customValue: "wxml" },
});

DefineComponent({ name: "customValue", rootComponent, subComponents: [subInline] });
