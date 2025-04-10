import type { DefaultSnippets } from "./types";

// 默认代码片段配置
export const defaultSnippets: DefaultSnippets = {
  "json": {
    "annil-component-default": {
      "prefix": "annil-component-default",
      "body": [
        "{",
        "  \"component\": true,",
        "  \"usingComponents\": {}",
        "}",
        "",
      ],
      "description": "Annil comp default snippet",
    },
    "annil-page-default": {
      "prefix": "annil-page-default",
      "body": [
        "{",
        "  \"usingComponents\": {}",
        "}",
        "",
      ],
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
        "type $$2 = {}",
        "typeEqual<$$2, typeof $1>();",
      ],
      "description": "Annil comp default snippet",
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
        "type $$2 = {",
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
      "body": [
        "<view class=\"${name}\">",
        "  ",
        "</view>",
      ],
      "description": "Annil comp default snippet",
    },
    "annil-page-default": {
      "prefix": "annil-page-default",
      "body": [
        "<view class=\"${name}\">",
        "  ",
        "</view>",
      ],
      "description": "Annil page default snippet",
    },
  },
  "wxss": {
    "annil-component-default": {
      "prefix": "annil-comp-wxss-default",
      "body": [], // 改成空数组，而不是包含空字符串的数组
      "description": "Annil comp default snippet",
    },
    "annil-page-default": {
      "prefix": "annil-page-wxss-default",
      "body": [], // 改成空数组，而不是包含空字符串的数组
      "description": "Annil page default snippet",
    },
  },
};
