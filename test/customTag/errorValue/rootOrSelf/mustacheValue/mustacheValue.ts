import { RootComponent, SubComponent } from "annil";
import type { $SubA } from "../../../subA";

const subA = SubComponent<Root, $SubA>()({
  inherit: {
    subA__id: "id",
  },
  data: {
    subA_numA: 1,
  },
  store: {
    subA_userList: () => [],
  },
});
type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  data: {
    id: "string",
  },
});
