import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

const rootComponent = RootComponent()({ data: {} });
type Root = typeof rootComponent;
const subInline = CustomComponent<Root, $SubInline>()({ events: { subInline_onTap() {} } });

// @ts-expect-error fixture only needs a subset of $SubInline fields
DefineComponent({ name: "missingAttrEvents", rootComponent, subComponents: [subInline] });
