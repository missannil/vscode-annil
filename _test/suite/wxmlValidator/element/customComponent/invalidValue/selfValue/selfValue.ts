import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({
  data: {},
});
type Root = typeof rootComponent;

const subInline = CustomComponent<Root, $SubInline>()({
  data: { subInline_cid: "ok" },
});

// @ts-expect-error fixture only needs a subset of $SubInline fields
DefineComponent({ name: "selfValue", rootComponent, subComponents: [subInline] });
