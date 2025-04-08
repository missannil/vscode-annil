/* eslint-disable @typescript-eslint/no-unused-vars */
import { type CreateComponentType, CustomComponent, DefineComponent, RootComponent } from "annil";
type $Demo = CreateComponentType<"demo", {
  properties: {
    bool: boolean;
    storeBool?: boolean;
    computedBool?: boolean;
    adataBool?: boolean;
  };
}>;
const demo = CustomComponent<Root, $Demo>()({
  store: {
    demo_storeBool: (): boolean => true,
  },
  computed: {
    demo_computedBool(): boolean {
      return this.data.demo_adataBool;
    },
    demo_isReady(): boolean {
      return this.data.demo_adataBool;
    },
  },
  data: {
    demo_adataBool: true,
  },
});

type Root = typeof rootComponent;

const rootComponent = RootComponent()({
  properties: {
    propBool: {
      type: Boolean,
      value: true,
    },
  },
  store: {
    storeBool: (): boolean => true,
  },
  computed: {
    computedBool(): boolean {
      return this.data.bool;
    },
  },
  data: {
    bool: true,
    list: [1, 2, 3],
  },
});
DefineComponent({
  name: "test",
  // @ts-ignore
  subComponents: [demo],
});
