import { type CreateComponentDoc, CustomComponent, DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({ data: { subInline__cid: "ok" } });
type Root = typeof rootComponent;
type $SubInline = CreateComponentDoc<"subInline_", {
  properties: {
    cid: string;
    inheritList?: unknown[];
    inheritBool?: boolean;
    dataList?: unknown[];
    dataBool?: boolean;
    computedList?: unknown[];
    computedBool?: boolean;
    storeList?: unknown[];
    storeBool?: boolean;
  };
}>;
const subInline = CustomComponent<Root, $SubInline>()({
  // @ts-expect-error 此字段故意使用非法的字符串值以覆盖 Self 诊断。
  inherit: { subInline__cid: "wxml" },
});

DefineComponent({ name: "missingAttrSelf", rootComponent, subComponents: [subInline] });
