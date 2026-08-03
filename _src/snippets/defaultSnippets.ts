import type { DefaultSnippets } from "./types.js";

export const defaultSnippets: DefaultSnippets = {
  "json": {
    "annil-component-default": {
      "prefix": "annil-component-default",
      "body": ["{", "  \"component\": true,", "  \"usingComponents\": {},", "  \"componentPlaceholder\": {}", "}", ""],
      "description": "Annil component default snippet",
    },
    "annil-page-default": {
      "prefix": "annil-page-default",
      "body": ["{", "  \"usingComponents\": {},", "  \"componentPlaceholder\": {}", "}", ""],
      "description": "Annil page default snippet",
    },
  },
  "typescript": {
    "annil-component-default": {
      "prefix": "annil-component-default",
      "body": [
        "import { DefineComponent, RootComponent, typeEqual } from \"annil\";",
        "",
        "// const chunk = ChunkComponent<Root>()({})",
        "// const custom = CustomComponent<Root, CompType>()({})",
        "// type Root = typeof rootComponent;",
        "const rootComponent = RootComponent()({",
        "  properties: {},",
        "  customEvents: {},",
        "})",
        "const $1 = DefineComponent({",
        "  name: \"$1\",",
        "  rootComponent,",
        "  subComponents: [],",
        "})",
        "export type $$2 = {}",
        "typeEqual<$$2, typeof $1>();",
      ],
      "description": "Annil component default snippet",
    },
    "annil-page-default": {
      "prefix": "annil-page-default",
      "body": [
        "import { DefineComponent, RootComponent, typeEqual } from \"annil\";",
        "",
        "// const chunk = ChunkComponent<Root>()({})",
        "// const custom = CustomComponent<Root, CompType>()({})",
        "// type Root = typeof rootComponent;",
        "const rootComponent = RootComponent()({",
        "  isPage: true,",
        "  properties: {},",
        "})",
        "const $1 = DefineComponent({",
        "  path: \"/$3\",",
        "  rootComponent,",
        "  subComponents: [],",
        "})",
        "export type $$2 = {",
        "  path: \"/$3\",",
        "}",
        "typeEqual<$$2, typeof $1>();",
      ],
      "description": "Annil page default snippet",
    },
  },
  "wxml": {
    "annil-component-default": {
      "prefix": "annil-wxml-default",
      "body": ["<block wx:if=\"{{attached}}\">", " ", "</block>"],
      "description": "Annil component default snippet",
    },
    "annil-page-default": {
      "prefix": "annil-page-default",
      "body": ["<block wx:if=\"{{attached}}\">", " ", "</block>"],
      "description": "Annil page default snippet",
    },
  },
  "wxss": {
    "annil-component-default": {
      "prefix": "annil-comp-wxss-default",
      "body": [],
      "description": "Annil component default snippet",
    },
    "annil-page-default": {
      "prefix": "annil-page-wxss-default",
      "body": [],
      "description": "Annil page default snippet",
    },
  },
};
