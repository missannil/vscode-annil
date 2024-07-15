import { type DetailedType, RootComponent, SubComponent } from "annil";
type User = {
  name: string;
  age: number;
};
const subA = SubComponent<Root, {}>()({});
type Root = typeof rootComponent;
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
    aaa: 567,
    dataList: [],
    dataTsList: [] as User[],
  },
  events: {
    onTap() {
      console.log("onTap");
    },
  },
});
