import type { TsFileInfo } from "../../out/componentManager/tsFileManager/types";

export const expectedTsFileInfo: TsFileInfo = {
  customComponentInfos: {
    subA: {
      _id: {
        type: "Union",
        values: ["aaa", "bbb"],
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
    // subC: {
    //   bool: {
    //     type: "Self",
    //     value: "subC_bool",
    //   },
    // },
    // h_image: {
    //   src: {
    //     type: "Self",
    //     value: "image_src",
    //   },
    // },
    subE: {
      num: {
        type: "Self",
        value: "subE_num",
      },
    },
  },
  rootComponentInfo: {
    arrTypeDatas: [
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
      "propBool",
      "propBoolObj",
      "userListSingle",
      "anyListFull",
      "userListFull",
      "userListComputed",
      "computedBool",
      "storeList",
      "numberStore",
      "storeBool",
      "aaa",
      "bbb",
      "dataList",
      "dataTsList",
      "dataBool",
    ],
    events: ["onTap"],
    boolTypeDatas: ["propBool", "propBoolObj", "computedBool", "storeBool", "dataBool"],
    customEvents: ["onCustomTap"],
  },
  importedSubCompInfo: {
    subA: "/mockComponents/subA",
    subB: "/mockComponents/subB",
  },
  chunkComopnentInfos: {
    chunk1: {
      dataList: ["ddd_src", "ddd_arr"],
      boolTypeDatas: [],
      arrTypeDatas: ["ddd_arr"],
      events: ["ddd_aaa"],
    },
    chunk2: {
      dataList: ["chunk2_bool"],
      boolTypeDatas: ["chunk2_bool"],
      arrTypeDatas: [],
      events: [],
    },
    chunk3: {
      dataList: ["chunk3_src"],
      boolTypeDatas: [],
      arrTypeDatas: [],
      events: [],
    },
  },
};
