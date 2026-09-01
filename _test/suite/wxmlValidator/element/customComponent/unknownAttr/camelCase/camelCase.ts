import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({
  data: { propRequiredBool: true },
});
type Root = typeof rootComponent;

const subInline = CustomComponent<Root, $SubInline>()({
  inherit: { subInline_inheritBool: "propRequiredBool" },
});

DefineComponent({ name: "camelCase", rootComponent, subComponents: [subInline] });
