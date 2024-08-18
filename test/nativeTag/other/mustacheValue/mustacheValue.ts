// import { type Dataset, DefineComponent, type DetailedType, RootComponent, SubComponent } from "annil";
// import type { $Image } from "../image/image";
// import type { Tailwind } from "../types/alias";
// @ts-nocheck
import { type Dataset, DefineComponent, type DetailedType, RootComponent } from "annil";

export type Item = {
  name: string;
  pic: string;
};

const rootComponent = RootComponent()({
  properties: {
    /**
     * 项目列表
     */
    _list: Array as DetailedType<Item[]>,
    /**
     * 活动项索引
     */
    activeIndex: {
      type: Number,
      value: 0,
    },
    twWrapper: {
      type: String as DetailedType<Tailwind>,
      value: " gap-y-16",
    },
    twItem: {
      type: String as DetailedType<Tailwind>,
      value: " gap-y-16",
    },
    // twImage: {
    //   type: String as DetailedType<Tailwind>,
    //   value: " w-110 h-110 primary rounded-20",
    // },
    twName: {
      type: String as DetailedType<Tailwind>,
      value: " px-8",
    },
    /**
     * 活动项的图片样式
     */
    twActiveImage: {
      type: String as DetailedType<Tailwind>,
      value: " w-110 h-110 primary rounded-20 border-4",
    },
    /**
     * 不活动项的图片样式
     */
    twInactiveImage: {
      type: String as DetailedType<Tailwind>,
      value: " w-110 h-110 primary rounded-20",
    },
    dddd: {
      type: String as DetailedType<Tailwind>,
      value: " w-110 h-110 primary rounded-20",
    },
    /**
     * 活动项的标题样式
     */
    twActiveName: {
      type: String as DetailedType<Tailwind>,
      value: " bg-green-500 text-white text-24 rounded-8",
    },
    /**
     * 非活动项的标题样式
     */
    twInactiveName: {
      type: String as DetailedType<Tailwind>,
      value: " text-24",
    },
  },
  data: {
    // 默认占位数据(骨架屏)
    mockList: Array(8).fill({ name: "加载中", pic: "" } satisfies Item) as Item[],
  },
  computed: {
    list(): Item[] {
      const { mockList, _list } = this.data;

      return _list.length === 0 ? mockList : _list;
    },
    itemWidth() {
      switch (this.data.list.length) {
        case 2:
          return "50%";
        case 3:
          return "33.33333333%";
        case 4:
          return "25%";
        case 6:
          return "33.33333333%";
        case 7:
          return "25%";
        case 8:
          return "25%";
        default:
          return `20%`;
      }
    },
  },
  customEvents: {
    indexChanged: Number,
  },
  events: {
    onTapItem(e: Dataset<{ index: number }>) {
      const curIndex = e.currentTarget.dataset.index;
      if (this.data.activeIndex !== curIndex) {
        this.indexChanged(curIndex);
      }
    },
  },
});

const imageTabs = DefineComponent({
  name: "imageTabs",
  rootComponent,
  subComponents: [h_image],
});

export type $ImageTabs = typeof imageTabs;
