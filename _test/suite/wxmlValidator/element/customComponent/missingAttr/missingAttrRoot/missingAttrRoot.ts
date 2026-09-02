import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({
  data: { propRequiredBool: true },
});

type Root = typeof rootComponent;
type TestSubInline = Omit<$SubInline, "properties"> & { properties: Partial<$SubInline["properties"]> };

const subInline = CustomComponent<Root, TestSubInline>()({
  inherit: { subInline_inheritBool: "propRequiredBool" },
});

DefineComponent({ name: "missingAttrRoot", rootComponent, subComponents: [subInline] });
