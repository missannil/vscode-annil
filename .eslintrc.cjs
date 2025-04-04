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
    "test/**",
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
    "@typescript-eslint/no-var-requires": 2, // 不运行使用require的方式引入模块
    "no-prototype-builtins": 2, // 不接受 Object.prototype的方法调用，需要用 call的方法调用
    "@typescript-eslint/no-explicit-any": 2, // 不可以显示的写any
    "@typescript-eslint/no-floating-promises": 2, // 禁止没有返回值的promise
    "@typescript-eslint/explicit-module-boundary-types": 2, // 函数返回和参数都应该明确写类型
    "@typescript-eslint/no-unused-vars": 1, // 没有使用的变量,
    "@typescript-eslint/ban-types": 2, // 不可以使用特殊的类型 比如 {}
    "@typescript-eslint/no-namespace": 2, // 不可以使用namespace
    "prefer-const": 1, // 优先使用const
    "@typescript-eslint/no-empty-interface": 2, // 不可以写空接口
    "no-mixed-spaces-and-tabs": 2, // 不可以混合使用空格和tab
    "@typescript-eslint/ban-ts-comment":"off", // 不可以使用ts注释
    "no-implicit-coercion": 2, // 不可以使用隐式类型转换
    "@typescript-eslint/no-non-null-assertion": 2, // 不可以使用非空断言
    "@typescript-eslint/strict-boolean-expressions": 2, // 不可以使用隐式类型转换
    "@typescript-eslint/explicit-function-return-type": 2, // 函数必须有返回类型
    "@typescript-eslint/padding-line-between-statements": [
      "warn",
      { blankLine: "always", prev: "*", next: "function" }, // 函数上一行必须有空行
      { blankLine: "always", prev: "*", next: "export" }, // export上一行必须有空行
      { blankLine: "always", prev: "*", next: "return" }, // return上一行必须有空行
    ],
    "complexity": [2, 10], // 代码复杂度
  },
};
