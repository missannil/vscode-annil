import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({ data: { list: [] as string[] } });
type Root = typeof rootComponent;
type TestSubInline = Omit<$SubInline, "properties"> & { properties: Partial<$SubInline["properties"]> };
const subInline = CustomComponent<Root, TestSubInline>()({
  inherit: {
    // @ts-expect-error 此字段故意用于覆盖缺少 Custom 属性诊断。
    subInline_customValue: "wxml",
  },
});

DefineComponent({ name: "missingAttrCustom", rootComponent, subComponents: [subInline] });
