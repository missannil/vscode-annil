import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({ data: { list: [] as string[] } });
type Root = typeof rootComponent;
const subInline = CustomComponent<Root, $SubInline>()({ inherit: { subInline_customValue: "wxml" } });

DefineComponent({ name: "missingAttrCustom", rootComponent, subComponents: [subInline] });
