# Change Log

### 0.1.0

修复 0.0.1 中 带_catch后缀事件添加属性错误的问题

### 0.2.0

重构

### 0.2.1

readme 

### 0.2.2

修复一些问题
增加忽略标签配置(如 { "annil.ignoreTags" : ["view","block","icon"] } ) 

### 0.3.0

支持annil 1.7.0新特性(子组件inherit配置新增数组类型值,表示wxml属性值应为三元表达式)

### 0.4.0

增加忽略属性配置(如 { "annil.ignoreAttrs" : ["wx:if","wx:for","wx:key"] } ),默认忽略的属性有 `class`、`style`、`id`和以`data-`开头的属性

增加点击自定义组件标签跳转功能
### 0.7.0
修复已知错误
新增: json文件检测(缺少导入,未知导入,错误的导入路径)

### 0.7.1

修复: json文件导入检测 增加判定,如果wxml中有使用导入的组件,则不报错为未知组件导入

新增: wxml文件更改时,增加对检测json文件

### 0.7.2
修复已知问题

### 0.7.5
修复已知问题

### 0.7.6 

fixed issue [#3](https://github.com/missannil/vscode-annil/issues/3) 和 [#4](https://github.com/missannil/vscode-annil/issues/4)

### 0.7.7

feat:  1. 如果wx:if的值以_isReady结尾并且在ts中以前缀名定义的子组件中有对应的值则通过检测。
	   2. 忽略检测 id 、以data- 开头的属性、
	   3. 自定义组件无定义以下属性时 twClass twHoverClass  style,忽略属性值检测。 
### 0.7.8

feat: 1. 自定义组件默认忽略属性增加class,便于对原生组件属性定义类型变为自定义组件后忽略class
	  2. 监控setting.json中配置的修改,无需重新加载拓展。