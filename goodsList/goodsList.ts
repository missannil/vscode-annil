import { DefineComponent, type DetailedType, RootComponent, SubComponent } from "annil";

import type { Goods } from "../../module/M_Goods";
import type { $Goods } from "../goods/goods";
import type { Tailwind } from "../types/Alias";

const goods = SubComponent<Root, $Goods>()({
  inherit: {
    goods_goods: "wxml",
    goods_twImage: "twImage",
    goods__twWrapperCol: "twWrapperCol",
    goods__direction: "direction",
  },
  events: {
    goods_increase_catch(e) {
      this.increase(e.detail);
    },
    goods_decrease_catch(e) {
      this.decrease(e.detail);
    },
  },
});

type Root = typeof rootComponent;

const rootComponent = RootComponent()({
  properties: {
    list: Array as DetailedType<Goods[]>,
    twWrapper: {
      type: String,
      value: "size-full flex  gap-y-20",
    },
    twImage: {
      type: String as DetailedType<Tailwind>,
      value: "primary w-full",
    },
    twWrapperCol: {
      type: String as DetailedType<Tailwind>,
      value: "bg-white gap-y-20  w-full",
    },
    twWrapperRow: {
      type: String as DetailedType<Tailwind>,
      value: "w-full gap-x-20",
    },
    direction: {
      type: String as DetailedType<"col" | "row">,
      value: "col",
    },
  },
  customEvents: {
    increase: {
      detail: Object as DetailedType<Goods>,
      options: {
        bubbles: true,
      },
    },
    decrease: {
      detail: Object as DetailedType<Goods>,
      options: {
        bubbles: true,
      },
    },
  },
  watch: {
    list(a, b) {
      console.log(a, b, 111);
    },
  },
});
const goodsList = DefineComponent({
  name: "goodsList",
  rootComponent,
  subComponents: [goods],
});
export type $GoodsList = typeof goodsList;
