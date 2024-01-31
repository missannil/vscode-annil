### 小程序Annil插件

### 功能

1. 自动写入wxml的组件属性

   当组件ts文件中包含子组件配置时,通过命令行`annil.auto-attribute`或快捷键(alt + s)触发命令,即可自动把ts中子组件配置字段写入到wxml对应的组件属性。可修改快捷键避免与之前快捷键冲突

   例如:
   ```ts
   // demo.ts

   const subA = SubComponent<Root, $SubA>()({
     inhrit: {
       subA_index: "wxml",
       subA_num: "count",
     },
     data: {
       subA_str: "string",
     },
     store: {
       subA_bool: () => (store.bool as false),
     },
     computed: {
       // 实际字段 _obj
       subA__obj() {
         return { xxx: 1, yyy: 2 };
       },
     },
     events: {
       subA_increase(e) {
         // ...
       },
       subA_decrease_catch(e) {
         // ...
       },
     },
   });
   const Root = RootComponent()({
     data: {
       count: 123,
     },
   });
   const demo = DefineComponent({
     subComponents: [subA],
   });
   ```
   ```html
   <!-- demo.wxml 原始状态-->
     <view>
    	<subA class="size-full"  />
     </view>
   ```

   ```html
   <!-- demo.wxml 触发annil.auto-attribute命令后-->
     <view>
    	<subA  
    		class="size-full"
    		index="{{自己写}}" 
    		num="{{count}}"
    		str="{{subA_str}}"
    		bool="{{subA_bool}}"
    		_obj="{{subA__obj}}"
    		bing:increase="subA_increase"
    		catch:decrease="subA_decrease_catch"
        />
     </view>
   ```
