/* eslint-disable @typescript-eslint/no-unused-vars */
import { DefineComponent, RootComponent, SubComponent } from "annil";
import type { $SubA, User } from "../../../../../../mockComponents/subA";

const subA = SubComponent<Root, $SubA>()({
  inherit: {
    subA_numA: "wxml",
  },
});

type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  data: {
    num: 123,
    strList: [] as string[],
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
