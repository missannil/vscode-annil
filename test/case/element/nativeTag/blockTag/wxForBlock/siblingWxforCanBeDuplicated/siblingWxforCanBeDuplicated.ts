import { type DetailedType, RootComponent } from "annil";
const user = {
  address: [] as string[],
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rootComponent = RootComponent()({
  properties: {
    propArr: Array,
    propList: {
      type: Array as DetailedType<string[]>,
      value: [],
    },
  },
  computed: {
    computedList(): string[] {
      return this.data.storeList;
    },
  },
  store: {
    storeList: (): string[] => user.address,
  },
  data: {
    arrRoot: [1, 2, 3] as number[],
    listRoot: [1, 2, 3],
    obj: { arr: [1, 2, 3] },
    noArr: "noArr",
  },
});
// <!-- 1 wx:for的值 允许以上层item定义的变量起始的.或[]表达式,或root中数组类型的变量 -->
// <!-- 1.0 wxfor的值可以为rootComponent中 类型为数组的computed属性 -->
// <block
// 	wx:for="{{computedList}}"
// 	wx:key="*this"
// ></block>

// <!-- 1.1 wxfor的值可以为rootComponent中 类型为数组的store属性 -->
// <block
// 	wx:for="{{storeList}}"
// 	wx:key="*this"
// ></block>

// <!-- 1.2 wxfor的值可以为rootComponent中 类型为数组的data属性 -->
// <block
// 	wx:for="{{arrRoot}}"
// 	wx:key="*this"
// ></block>
// <block
// 	wx:for="{{listRoot}}"
// 	wx:key="*this"
// ></block>

// <!-- 1.3 wxfor的值可以为rootComponent中 类型为数组的properties属性 -->
// <block
// 	wx:for="{{propArr}}"
// 	wx:key="*this"
// ></block>

// <!-- 1.4 wx:for的值 上层item定义的变量起始的.或[]表达式, -->
// <block
// 	wx:for="{{computedList}}"
// 	wx:key="*this"
// >
// 	<block
// 		wx:for="{{item.xxx}}"
// 		wx:key="*this"
// 		wx:for-index="yyy"
// 		wx:for-item="xxx"
// 	></block>
// 	<block
// 		wx:for="{{item[0].xxx}}"
// 		wx:key="*this"
// 		wx:for-index="yyy"
// 		wx:for-item="xxx"
// 	></block>
// 	<block
// 		wx:for="{{item[0].xxx[ddd]}}"
// 		wx:key="*this"
// 		wx:for-index="yyy"
// 		wx:for-item="xxx"
// 	></block>
// 	<!-- 1.5 这种表达式没有检查，实际代码中会在编译阶段立刻给出提示 -->
// 	<block
// 		wx:for="{{index > 0}}"
// 		wx:key="*this"
// 		wx:for-index="yyy"
// 		wx:for-item="xxx"
// 	></block>
// </block>
// <!-- 1.5 非数组类型 报错 -->
// <block
// 	wx:for="{{noArr}}"
// 	wx:key="*this"
// ></block>

// <!-- 1.6 语法报错-->
// <block
// 	wx:for="{{ xxxfff }"
// 	wx:key="*this"
// ></block>
// <!-- 2  缺少wx:key 要求必须写wx:key 可以是变量或*this-->
// <block
// 	wx:for="{{computedList}}"
// 	wx:key="*this"
// >
// 	<block wx:for="{{item.xxx}}"></block>
// </block>
// <!-- 2 wx:key 的值可以为*this -->
// <block
// 	wx:for="{{propList}}"
// 	wx:key="*this"
// ></block>
// <!-- 2.1 wxkey 合法变量 -->
// <block
// 	wx:for="{{propList}}"
// 	wx:key="ddd"
// ></block>

// <!-- 2.2 wx:key变量错误-->
// <block
// 	wx:for="{{computedList}}"
// 	wx:key="xxx"
// >
// 	<block
// 		wx:key="123"
// 		wx:for="{{item.xxx}}"
// 		wx:for-index="yyy"
// 		wx:for-item="xxx"
// 	></block>
// </block>
// <!-- 3 wx:for-item wx:for-index 无效变量 -->
// <block
// 	wx:for="{{computedList}}"
// 	wx:key="*this"
// >
// 	<block
// 		wx:for="{{item.xxx}}"
// 		wx:for-item="1item"
// 		wx:for-index="a a a"
// 		wx:key="ddd"
// 	></block>
// </block>
// <!-- 3.1 wx:for-item wx:for-index 与上层相同变量 -->
// <block
// 	wx:for="{{computedList}}"
// 	wx:for-item="itemA"
// 	wx:key="*this"
// >
// 	<block
// 		wx:for="{{itemA.xxx}}"
// 		wx:for-item="itemA"
// 		wx:for-index="index"
// 		wx:key="ddd"
// 	></block>
// </block>

// <!-- 3.3 wx:for-item wx:for-index 内层没有写item和index时也会检查与上层是否重复 -->
// <block
// 	wx:for="{{computedList}}"
// 	wx:key="xxx"
// >
// 	<block
// 		wx:for="{{item.xxx}}"
// 		wx:key="xxx"
// 	></block>
// </block>
