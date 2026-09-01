import { type CreateComponentDoc, CustomComponent, DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({ data: { subInline__cid: "ok" } });
type Root = typeof rootComponent;
type $SubInline = CreateComponentDoc<"subInline_", { properties: { cid: string } }>;
const subInline = CustomComponent<Root, $SubInline>()({ inherit: { subInline__cid: "wxml" } });

DefineComponent({ name: "missingAttrSelf", rootComponent, subComponents: [subInline] });
