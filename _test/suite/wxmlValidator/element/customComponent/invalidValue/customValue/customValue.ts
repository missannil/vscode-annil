import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({
  data: { list: [] as string[] },
  computed: { activeIndex: () => 0 },
});
type Root = typeof rootComponent;

const subInline = CustomComponent<Root, $SubInline>()({
  inherit: { subInline_customValue: "wxml" },
});

DefineComponent({ name: "customValue", rootComponent, subComponents: [subInline] });
