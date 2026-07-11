import { type BubblesComposed, DefineComponent, RootComponent, typeEqual } from "annil";

const rootComponent = RootComponent()({
  properties: {
    cid: {
      type: String,
      value: "subInline",
    },
    inheritList: Array,
    inheritBool: Boolean,
    dataList: Array,
    dataBool: Boolean,
    computedList: Array,
    computedBool: Boolean,
    storeList: Array,
    storeBool: Boolean,
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
    subInline_inheritList: unknown[];
    subInline_inheritBool: boolean;
    subInline_dataList: unknown[];
    subInline_dataBool: boolean;
    subInline_computedList: unknown[];
    subInline_computedBool: boolean;
    subInline_storeList: unknown[];
    subInline_storeBool: boolean;
  };
  events: {
    subInline_onTap: string;
    subInline_eventA: string | BubblesComposed;
  };
};
typeEqual<$SubInline>()(subInline);
