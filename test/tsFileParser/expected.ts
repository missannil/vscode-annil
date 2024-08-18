import { type TsFileInfo } from "../../src/componentManager/tsFileManager";

export const expectedResult: TsFileInfo = {
  subComponentInfo: {
    subA: {
      _id: {
        type: "UnionRoot",
        value: ["aaa", "bbb"],
      },
      numA: {
        type: "Custom",
        value: "自定义",
      },
      userList: {
        type: "Self",
        value: "subA_userList",
      },
    },
    subB: {
      num: {
        type: "Self",
        value: "subB_num",
      },
    },
    subC: {
      bool: {
        type: "Self",
        value: "subC_bool",
      },
    },
    h_image: {
      str: {
        type: "Self",
        value: "image_str",
      },
    },
    subE: {
      num: {
        type: "Self",
        value: "subE_num",
      },
    },
  },
  rootComponentInfo: {
    arrTypeData: [
      "anyList",
      "userListSingle",
      "anyListFull",
      "userListFull",
      "userListComputed",
      "storeList",
      "dataList",
      "dataTsList",
    ],
    dataList: [
      "anyList",
      "userListSingle",
      "anyListFull",
      "userListFull",
      "userListComputed",
      "storeList",
      "numberStore",
      "aaa",
      "bbb",
      "dataList",
      "dataTsList",
    ],
    events: ["onTap"],
  },
  importedSubCompInfo: {
    subA: "/mockComponents/subA",
    subB: "/mockComponents/subB",
    subC: "../mockComponents/subC",
    h_image: "../mockComponents/image",
  },
};
