import { CustomComponent, DefineComponent, RootComponent } from "annil";
// @ts-expect-error app.json resolveAlias is a WeChat compiler alias, not a TypeScript paths alias.
import type { $AliasCard } from "~/cards/aliasCard.js";
// @ts-expect-error app.json resolveAlias is a WeChat compiler alias, not a TypeScript paths alias.
import type { $AliasPanel } from "@Components/panels/aliasPanel.js";

const rootComponent = RootComponent()({ properties: {}, data: {} });
type Root = typeof rootComponent;
const aliasCard = CustomComponent<Root, $AliasCard>()({});
const aliasPanel = CustomComponent<Root, $AliasPanel>()({});

DefineComponent({ name: "resolveAliasComponent", rootComponent, subComponents: [aliasCard, aliasPanel] });
