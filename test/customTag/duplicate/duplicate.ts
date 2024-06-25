import { SubComponent } from "annil";

type SubA = {
  properties: {
    subA_numAA: number;
  };
  customEvents: {
    // subA_onTap: string;
  };
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const subA = SubComponent<{}, SubA>()({
  data: {
    subA_numAA: 1,
    // subA_userList: [{ _id: "1", name: "1" }],
  },
});
