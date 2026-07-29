import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubExternal } from "~/subExternal/subExternal.js";

const rootComponent = RootComponent()({ properties: {}, data: {} });

type Root = typeof rootComponent;

const subExternal = CustomComponent<Root, $SubExternal>()({});

DefineComponent({ name: "validAlias", rootComponent, subComponents: [subExternal] });
