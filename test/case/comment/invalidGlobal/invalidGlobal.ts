import { DefineComponent, RootComponent } from "annil";
// import type { $SubA } from "~/subA";
// import type { $SubB } from "~/subB";

// const subA = CustomComponent<Root, $SubA>()({
//   data: {
//     subA__id: "subA",
//     subA_numA: 0,
//     subA_userList: [],
//   },
// });

// const subB = CustomComponent<Root, $SubB>()({
//   data: {
//     subB_num: 0,
//   },
// });

type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  isPage: false,
});
DefineComponent({
  name: "textError",
  rootComponent,
  // customComponents: [subA, subB],
});
