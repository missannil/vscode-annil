import { SubComponent } from "annil";
import type { $SubA } from "../../mockComponents/subA";
import type { $SubB } from "../../mockComponents/subB";
import type { $SubC } from "../../mockComponents/subC";

const subA = SubComponent<{}, $SubA>()({
  data: {},
});

const subB = SubComponent<{}, $SubB>()({
  data: {},
});
const subC = SubComponent<{}, $SubC>()({
  data: {},
});
