module.exports = {
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: ["./tsconfig.json"],
  },
  ignorePatterns: [
    ".eslintrc.cjs",
    "rollup.config.mjs",
    "**/*.js",
    "**/*.d.ts",
  ], // 忽略检查的文件 优先级低于外部定义
  globals: {
    wx: true,
    App: true,
    Page: true,
    getCurrentPages: true,
    getApp: true,
    Component: true,
    requirePlugin: true,
    requireMiniProgram: true,
  },
  /**
   * 由名称:与插件 Prettier ESLint https://marketplace.visualstudio.com/items?itemName=rvest.vs-code-prettier-eslint 冲突
   */

  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],

  rules: {
    // 0 1 2 对应 off warning error
    "@typescript-eslint/explicit-member-accessibility": 2, // 类要显示声明访问权限修饰符 public private  protected
    "@typescript-eslint/no-var-requires": 0, // 不运行使用require的方式引入模块
    "no-prototype-builtins": 0, // 不接受 Object.prototype的方法调用，需要用 call的方法调用
    "@typescript-eslint/no-explicit-any": 0, // 不可以显示的写any
    "@typescript-eslint/no-floating-promises": "error", // 禁止没有返回值的promise
    "@typescript-eslint/explicit-module-boundary-types": 0, // 函数返回和参数都应该明确写类型
    "@typescript-eslint/no-unused-vars": 1, // 没有使用的变量,
    "@typescript-eslint/ban-types": 0, // 不可以使用特殊的类型 比如 {}
    "@typescript-eslint/no-namespace": 0, // 不可以使用namespace
    "prefer-const": 1, // 为什么不写const 呢？
    "@typescript-eslint/no-empty-interface": 2, // 不可以写空接口
    "no-mixed-spaces-and-tabs": "off",
    "@typescript-eslint/ban-ts-comment": 0,
    "padding-line-between-statements": 0,
    "no-implicit-coercion": 2,
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/explicit-function-return-type": "error", // 函数必须有返回类型
    "@typescript-eslint/padding-line-between-statements": [
      "warn",
      { blankLine: "always", prev: "*", next: "function" },
      { blankLine: "always", prev: "*", next: "export" },
      // { blankLine: "always", prev: "const", next: "expression" },
      // { blankLine: "always", prev: "*", next: "class" },
      // { blankLine: "always", prev: "class", next: "*" },
      { blankLine: "always", prev: "*", next: "return" },
      // { blankLine: "always", prev: "expression", next: "*" },
      // { blankLine: "always", prev: "*", next: ["interface", "type"] },
      // { blankLine: "always", prev: ["interface", "type"], next: "*" },
    ],
    "complexity": ["error", 10], // 代码复杂度
  },
};
