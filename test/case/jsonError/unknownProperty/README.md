### 需求设计

`.wxml`文件中缺少 `.ts`文件中`引入`的`公共组件`时要报错

### demo 说明

在 [missingTag.ts](./missingTag.ts)中,通过二种方式导入了四个子组件类型($SubA,$SubB,$SubC,$SubD)和临时类型$SubE,tsFileInfo中得到的所有组件名列表为 `[ "$SubA", "$SubB", "$SubC", "$SubD","$SubDXx","$SubE"]`

收集ts子组件时,生成的tsFileInfo中,

而在[missingTag.wxml](./missingTag.wxml)中得到的wxmlFileInfo中 已存在的组件为:`["$SubA", "$SubB","$SubDXx"]`

计算得到缺失的类型为 `["$SubC","$SubD","$SubE"]`
