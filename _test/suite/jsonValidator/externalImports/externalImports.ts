import { DefineComponent, RootComponent } from "annil";
import { cart } from "./useCart.js";
import { external } from "./useExternal.js";

const rootComponent = RootComponent()({ properties: {}, data: {} });

export type Root = typeof rootComponent;

DefineComponent({ name: "externalImports", rootComponent, subComponents: [cart, external] });
