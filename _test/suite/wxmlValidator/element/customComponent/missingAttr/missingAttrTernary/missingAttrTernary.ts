import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({ data: { condition: true } });
type Root = typeof rootComponent;
const subInline = CustomComponent<Root, $SubInline>()({
  inherit: { subInline_mode: ["on", "off"] },
});

DefineComponent({ name: "missingAttrTernary", rootComponent, subComponents: [subInline] });
