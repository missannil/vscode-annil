import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubExternal } from "../../../miniprogram/components/subExternal/subExternal.js";

const rootComponent = RootComponent()({ properties: {}, data: {} });

type Root = typeof rootComponent;

const validComponent = CustomComponent<Root, $SubExternal>()({});

DefineComponent({ name: "invalidPath", rootComponent, subComponents: [validComponent] });
