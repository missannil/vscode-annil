/* eslint-disable @typescript-eslint/no-unused-vars */
import { RootComponent } from "annil";

// const subA = CustomComponent<Root, $SubA>()({
//   data: {},
// });

// const subB = CustomComponent<Root, $SubB>()({
//   data: {},
// });

type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  data: {
    str: "string",
    $num: 1,
    list: [1, 2, 3],
  },
});
