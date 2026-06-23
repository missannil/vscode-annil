// @ts-check
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  // 全局忽略
  {
    ignores: [
      "**/*.js",
      "**/*.mjs",
      "**/*.d.ts",
      "out/**",
      "src/**",
      "test/**",
    ],
  },
  // 基础配置
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: new URL(".", import.meta.url).pathname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        wx: "readonly",
        App: "readonly",
        Page: "readonly",
        getCurrentPages: "readonly",
        getApp: "readonly",
        Component: "readonly",
        requirePlugin: "readonly",
        requireMiniProgram: "readonly",
      },
    },
  },
  // TypeScript 推荐规则
  ...tseslint.configs.recommended,
  // 自定义规则
  {
    rules: {
      // 0=off 1=warn 2=error
      "@typescript-eslint/explicit-member-accessibility": "error",
      "@typescript-eslint/no-require-imports": "error",
      "no-prototype-builtins": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-namespace": "error",
      "prefer-const": "warn",
      "no-mixed-spaces-and-tabs": "error",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-implicit-coercion": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "*", next: "function" },
        { blankLine: "always", prev: "*", next: "export" },
        { blankLine: "always", prev: "*", next: "return" },
      ],
      "complexity": ["error", 10],
    },
  },
);
