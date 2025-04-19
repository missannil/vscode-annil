import type { ComponentInfo } from "../../out/componentManager/tsFileManager/types";

export const expectedComponentInfo: ComponentInfo = {
  customComponentInfos: {
    subA: {
      line: 5,
      fsPath: "/Users/xxxx/Desktop/vscode-annil/test/tsFileParser/demoComp/subA.ts",
      componentTypeName: "$SubA",
      configInfo: {
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
    },
    subB: {
      line: 20,
      fsPath: "/Users/xxxx/Desktop/vscode-annil/test/tsFileParser/demoComp/demoComp.ts",
      componentTypeName: "$SubB",
      configInfo: {
        num: {
          type: "Self",
          value: "subB_num",
        },
      },
    },
    subC: {
      line: 4,
      fsPath: "/Users/xxxx/Desktop/vscode-annil/test/miniprogram/otherUseComponents/useSubC.ts",
      componentTypeName: "$SubC",
      configInfo: {
        bool: {
          type: "Self",
          value: "subC_bool",
        },
      },
    },
    page: {
      line: 5,
      fsPath: "/Users/xxxx/Desktop/vscode-annil/test/miniprogram/useCommon/usePage.ts",
      componentTypeName: "$Page",
      configInfo: {
        style: {
          type: "Self",
          value: "page_style",
        },
      },
    },
    subE: {
      line: 48,
      fsPath: "/Users/xxxx/Desktop/vscode-annil/test/tsFileParser/demoComp/demoComp.ts",
      componentTypeName: "$SubE",
      configInfo: {
        num: {
          type: "Self",
          value: "subE_num",
        },
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
    page: "/components/page/page",
    subA: "/components/subA",
    subB: "/components/subB",
    subC: "/otherComponents/subC",
  },
  chunkComponentInfos: {
    chunk1: {
      fsPath: "/Users/xxxx/Desktop/vscode-annil/test/tsFileParser/demoComp/demoComp.ts",
      line: 32,
      configInfo: {
        dataList: ["ddd_src", "ddd_arr"],
        boolTypeDatas: [],
        arrTypeDatas: ["ddd_arr"],
        events: ["ddd_aaa"],
      },
    },
    chunk2: {
      fsPath: "/Users/xxxx/Desktop/vscode-annil/test/tsFileParser/demoComp/demoComp.ts",
      line: 26,
      configInfo: {
        dataList: ["chunk2_bool"],
        boolTypeDatas: ["chunk2_bool"],
        arrTypeDatas: [],
        events: [],
        // customEvents:[],
      },
    },
    chunk3: {
      fsPath: "/Users/xxxx/Desktop/vscode-annil/test/tsFileParser/demoComp/chunk3.ts",
      line: 4,
      configInfo: {
        dataList: ["chunk3_src"],
        boolTypeDatas: [],
        arrTypeDatas: [],
        events: [],
        // customEvents:[],
      },
    },
  },
};
