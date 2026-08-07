import { CustomComponent } from "annil";
import type { Root } from "./annilDefinition.js";

type ExternalDoc = {
  properties: {
    externalComp_value: boolean;
  };
};

export const externalComp = CustomComponent<Root, ExternalDoc>()({
  inherit: { externalComp_value: "propRequiredBool" },
});
