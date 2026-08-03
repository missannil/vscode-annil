import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubExternal } from "../../../miniprogram/components/subExternal/subExternal.js";

const rootComponent = RootComponent()({ properties: {}, data: {} });
type Root = typeof rootComponent;

const firstComponent = CustomComponent<Root, $SubExternal>()({});
const secondComponent = CustomComponent<Root, $SubExternal>()({});

DefineComponent({
  name: "missingPlaceholders",
  rootComponent,
  subComponents: [firstComponent, secondComponent],
});
