import { DefineComponent, type DetailedType, RootComponent } from "annil";

export type User = {
  _id: string;
  name: string;
  age?: number;
};
const rootComponent = RootComponent()({
  properties: {
    _id: String,
    numA: Number,
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
