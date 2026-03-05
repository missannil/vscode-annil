import { DefineComponent, type DetailedType, RootComponent } from "annil";

export type User = {
  cid?: string;
  name: string;
  age?: number;
};
const rootComponent = RootComponent()({
  properties: {
    cid: {
      type: String,
      value: "subA",
    },
    numA: {
      type: Number,
      value: 0,
    },
    userList: Array as DetailedType<User[]>,
  },
  customEvents: {
    onTap: String,
    eventA: {
      detail: String,
      options: {
        bubbles: true,
        composed: true,
      },
    },
  },
});

const subA = DefineComponent({
  name: "subA",
  rootComponent,
});

export type $SubA = typeof subA;
