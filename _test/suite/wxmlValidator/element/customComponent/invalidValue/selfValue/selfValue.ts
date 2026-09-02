import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({
  data: {},
});
type Root = typeof rootComponent;
type TestSubInline = Omit<$SubInline, "properties"> & { properties: Partial<$SubInline["properties"]> };

const subInline = CustomComponent<Root, TestSubInline>()({
  data: { subInline_cid: "ok" },
});

DefineComponent({ name: "selfValue", rootComponent, subComponents: [subInline] });
