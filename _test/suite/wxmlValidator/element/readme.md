### element 目录

存放针对 wxml文件中元素类型标签的验证逻辑的测试示例。

#### annilComment 子目录

存放 `annil注释元素`相关逻辑的测试示例。
`annil注释元素`是指 wxml 中属于注释类型的标签,且注释内容已`annil disable`标记开头的注释元素，例如 <!-- annil disable invalid -->。

#### nativeComponent 子目录

`原生组件`是微信小程序官方定义的元素标签,

<!-- 需要注意的是，如果原生组件有id属性,但该id属性值不是在组件的ts文件(组件tsInfo)中通过ChunkComponent定义了的一个变量名,则不属于Chunk组件,而属于原生组件。 -->

#### chunkComponent 子目录

存放 `Chunk组件` 相关逻辑的测试示例。
当元素组件存在id属性,且id值在组件的ts文件信息中的chunkComponents中存在时,则该元素是`Chunk组件`。

#### customComponent 子目录

存放 `自定义组件`相关逻辑的测试示例。
`自定义组件`是指 wxml 中属于元素类型的标签，且不是原生组件的标签。
