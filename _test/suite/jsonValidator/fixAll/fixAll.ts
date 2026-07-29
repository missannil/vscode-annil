import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubExternal } from "../../../miniprogram/components/subExternal/subExternal.js";
import type { $SubInline } from "../../../miniprogram/components/subInline/index.js";

const rootComponent = RootComponent()({ properties: {}, data: {} });

type Root = typeof rootComponent;

const pathComponent = CustomComponent<Root, $SubExternal>()({});
const missingComponent = CustomComponent<Root, $SubInline>()({
  data: {
    subInline_inheritList: [],
    subInline_inheritBool: false,
    subInline_dataList: [],
    subInline_dataBool: false,
    subInline_computedList: [],
    subInline_computedBool: false,
    subInline_storeList: [],
    subInline_storeBool: false,
  },
});

DefineComponent({ name: "jsonFixAll", rootComponent, subComponents: [pathComponent, missingComponent] });
