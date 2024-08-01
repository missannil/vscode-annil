import { type TsFileInfo } from "../../src/componentManager/tsFileManager";

export const expectedResult: TsFileInfo = {
  subComponentInfo: {
    subA: {
      _id: {
        type: "Self",
        value: "subA__id",
      },
      numA: {
        type: "Self",
        value: "subA_numA",
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
