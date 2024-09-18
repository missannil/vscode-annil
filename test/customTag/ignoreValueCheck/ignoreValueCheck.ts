import { RootComponent, SubComponent } from "annil";
import type { $SubA } from "~/subA";

const subA = SubComponent<Root, $SubA>()({

});
type Root = typeof rootComponent;

const rootComponent = RootComponent()({
  data: {
    arr: [1, 2, 3] as number[],
    bool: true,
    str: "string",
    num: 123,
  },
});
