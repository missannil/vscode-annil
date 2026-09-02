import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({ data: { condition: true } });
type Root = typeof rootComponent;
type TestSubInline = Omit<$SubInline, "properties"> & { properties: Partial<$SubInline["properties"]> };
const subInline = CustomComponent<Root, TestSubInline>()({
  // @ts-expect-error 此字段故意使用非法字段名以覆盖 Ternary 诊断。
  inherit: { subInline_mode: ["on", "off"] },
});

DefineComponent({ name: "missingAttrTernary", rootComponent, subComponents: [subInline] });
