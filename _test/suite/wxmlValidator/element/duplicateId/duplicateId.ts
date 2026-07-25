/* eslint-disable @typescript-eslint/no-unused-vars */
import { DefineComponent, RootComponent } from "annil";

type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  properties: {
    cid: {
      type: String,
      value: "root",
    },
  },
  data: {
    xxx: "xxx",
    fff: "fff",
    list: [1, 2, 3],
  },
});

DefineComponent({
  name: "duplicateId",
  rootComponent,
  subComponents: [],
});
