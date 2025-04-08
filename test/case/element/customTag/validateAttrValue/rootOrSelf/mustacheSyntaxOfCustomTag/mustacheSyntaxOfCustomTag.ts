import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubA } from "~/subA";
// eslint-disable-next-line @typescript-eslint/no-unused-vars

const subA = CustomComponent<Root, $SubA>()({
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
DefineComponent({
  subComponents: [subA, subB],
});
