import { type BubblesComposed, DefineComponent, type DetailedType, RootComponent, typeEqual } from "annil";

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
    userList: {
      type: Array as DetailedType<User[]>,
      value: [],
    },
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

export type $SubA = {
  properties: {
    subA_cid?: string;
    subA_numA?: number;
    subA_userList?: User[];
  };
  events: {
    subA_onTap: string;
    subA_eventA: string | BubblesComposed;
  };
};
typeEqual<$SubA>()(subA);
