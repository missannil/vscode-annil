import { type BubblesComposed, DefineComponent, RootComponent, typeEqual } from "annil";

const rootComponent = RootComponent()({
  properties: {
    cid: {
      type: String,
      value: "subExternal",
    },
    str: {
      type: String,
      value: "str",
    },
    userList: {
      type: Array,
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

const subExternal = DefineComponent({
  name: "subExternal",
  rootComponent,
});

export type $SubExternal = {
  properties: {
    subExternal_cid?: string;
    subExternal_str?: string;
    subExternal_userList?: unknown[];
  };
  events: {
    subExternal_onTap: string;
    subExternal_eventA: string | BubblesComposed;
  };
};
typeEqual<$SubExternal>()(subExternal);
