/* eslint-disable @typescript-eslint/no-unused-vars */
import { RootComponent, SubComponent } from "annil";
import type { $SubA } from "../../mockComponents/subA";

const subA = SubComponent<Root, $SubA>()({
  data: {
    subA_numA: 1,
    subA__id: "id",
    subA_userList: [],
  },
});
type Root = typeof root;
const root = RootComponent()({
  data: {
    list: [1, 2, 3],
    noList: 123,
  },
});
