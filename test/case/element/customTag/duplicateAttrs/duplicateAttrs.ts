import { CustomComponent, DefineComponent } from "annil";

type SubA = {
  properties: {
    subA_numAA: number;
  };
  customEvents: {
    // subA_onTap: string;
  };
};

const subA = CustomComponent<object, SubA>()({
  data: {
    subA_numAA: 1,
    // subA_userList: [{ _id: "1", name: "1" }],
  },
});

DefineComponent({
  name: "test",
  subComponents: [subA],
});
