import { type TsFileInfo } from "../../src/componentManager/tsFileManager";

export const expectedResult: TsFileInfo = {
  subComponentInfo: {
    subA: {},
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
};
