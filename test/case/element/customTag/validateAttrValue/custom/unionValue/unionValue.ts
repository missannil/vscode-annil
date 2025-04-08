/* eslint-disable @typescript-eslint/no-unused-vars */
import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubA, User } from "../../../../../../mockComponents/subA";

const subA = CustomComponent<Root, $SubA>()({
  inherit: {
    subA_numA: ["num", "num1"],
  },
});

type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  data: {
    num: 123,
    num1: 456,
    strList: [],
  },
  store: {
    userList: (): User[] => [],
  },
});
DefineComponent({
  name: "test",
  // @ts-ignore
  subComponents: [subA],
});
