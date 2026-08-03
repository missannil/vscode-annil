import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({ data: { list: [] as string[] } });
type Root = typeof rootComponent;
// @ts-expect-error fixture attribute is intentionally outside the imported component type
const subInline = CustomComponent<Root, $SubInline>()({ inherit: { subInline_customValue: "wxml" } });

// @ts-expect-error fixture only needs a subset of $SubInline fields
DefineComponent({ name: "missingAttrCustom", rootComponent, subComponents: [subInline] });
