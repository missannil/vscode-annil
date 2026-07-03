import { type BubblesComposed, DefineComponent, RootComponent, typeEqual } from "annil";

const rootComponent = RootComponent()({
  properties: {
    cid: {
      type: String,
      value: "subInline",
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

const subInline = DefineComponent({
  name: "subInline",
  rootComponent,
});

export type $SubInline = {
  properties: {
    subInline_cid?: string;
    subInline_str?: string;
    subInline_userList?: unknown[];
  };
  events: {
    subInline_onTap: string;
    subInline_eventA: string | BubblesComposed;
  };
};
typeEqual<$SubInline>()(subInline);
