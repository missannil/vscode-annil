// @ts-nocheck

import { DefineComponent, RootComponent } from "annil";
const home = SubComponent<Root, $Home>()({
  data: {
    home_isReady: true,
  },
  computed: {
    home_hidden(): boolean {
      return this.data.activeIndex !== 0;
    },
  },
});
const rootComponent = RootComponent()({
  data: {
    arr: [1, 2, 3] as number[],
    list: [1, 2, 3],
    bool: true,
  },
});

const test = DefineComponent({
  rootComponent,
  subComponents: [home],
});
