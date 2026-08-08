import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({
  data: { list: [] as string[] },
  computed: { activeIndex: () => 0 },
});
type Root = typeof rootComponent;

const subInline = CustomComponent<Root, $SubInline>()({
  // @ts-expect-error fixture attribute is intentionally outside the imported component type
  inherit: { subInline_customValue: "wxml" },
});

// @ts-expect-error fixture only needs a subset of $SubInline fields
DefineComponent({ name: "customValue", rootComponent, subComponents: [subInline] });
