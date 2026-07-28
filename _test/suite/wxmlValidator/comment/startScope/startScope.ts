import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({ properties: {}, data: {} });

DefineComponent({ name: "startScope", rootComponent, subComponents: [] });
