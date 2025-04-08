import { CustomComponent, RootComponent } from "annil";

type SubA = {
  properties: {
    subA_data: number;
    subA_inheritUnion: string;
    subA_computed: string;
    subA_store: number;
  };
  customEvents: {
    // subA_onTap: string;
  };
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const subA = CustomComponent<Root, SubA>()({
  inherit: {
    // subA_inheritUnion: ["xxx", "yyy"],
  },
  store: {
    subA_store: () => 123,
  },
  computed: {
    subA_computed(): string {
      return this.data.subA_data + "a";
    },
  },
  data: {
    subA_data: 1,
    // subA_userList: [{ _id: "1", name: "1" }],
  },
});
type Root = typeof root;
const root = RootComponent()({
  data: {
    list: [1, 2, 3],
  },
});
