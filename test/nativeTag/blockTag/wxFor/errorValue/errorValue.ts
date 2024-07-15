import { type DetailedType, RootComponent, SubComponent } from "annil";
type User = {
  name: string;
  age: number;
};
// const subA = SubComponent<Root, {}>()({});
// type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  properties: {
    anyList: Array,
    userListSingle: Array as DetailedType<User[]>,
    anyListFull: {
      type: Array,
      value: [],
    },
    userListFull: {
      type: Array as DetailedType<User[]>,
      value: [],
    },
    // optionaAnylList: {
    //   type: String,
    //   optionalTypes: [Array],
    // },
    // optionaUserlList: {
    //   type: String,
    //   optionalTypes: [Array as DetailedType<User[]>],
    // },
  },
  computed: {
    userListComputed(): User[] {
      return this.data.userListFull;
    },
  },
  store: {
    storeList: (): User[] => [],
    numberStore: (): number => 123,
  },
  data: {
    aaa: 123,
  },
  events: {
    onTap() {
      console.log("onTap");
    },
  },
});
