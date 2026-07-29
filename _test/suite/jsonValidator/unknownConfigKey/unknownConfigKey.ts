import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({ properties: {}, data: {} });

DefineComponent({ name: "unknownConfigKey", rootComponent, subComponents: [] });
