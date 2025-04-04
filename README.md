### 介绍

小程序原生开发插件`annil`的拓展

### 功能

1. 错误诊断
   当打开一个组件的任意一个文件(`.wxml`|`.ts`|`.json`)时,会自动生成当前组件`.wxml`和`.json`文件的诊断信息,在文件和问题面板中给出提示信息

2. 文件错误修复
   快速修复菜单中,提供修复当前错误和修复全部错误的选项(不可修复的错误没有修复选项)
   在任意组件文件中使用快捷键(默认: `alt + s`)会触发命令(`fix-diagnostics`),修复当前组件`.wxml和.json`中的全部错误(与快速修复菜单中的修复全部选项同效)

3. wxml文件中自定义组件标签的跳转
   使用 `ctrl + 左键` 点击自定义组件标签时自动在跳转到(在新的编辑器中打开)自定义组件的`.ts`文件。

### 配置说明

1. 忽略检查的字段 - 属性名或变量名
   ```json
   "annil.ignoreFeilds": [] //  默认 ['id','data-']
   ```
