import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({
  data: {},
});
type Root = typeof rootComponent;

const subInline = CustomComponent<Root, $SubInline>()({
  events: { subInline_onTap() {} },
});

DefineComponent({ name: "eventsValue", rootComponent, subComponents: [subInline] });
