import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({
  data: { propRequiredBool: true },
});
type Root = typeof rootComponent;

const subInline = CustomComponent<Root, $SubInline>()({
  inherit: { subInline_inheritBool: "propRequiredBool" },
});

// @ts-expect-error fixture only needs a subset of $SubInline fields
DefineComponent({ name: "missingAttrSelfClosing", rootComponent, subComponents: [subInline] });
