/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

const chunk = SubComponent<Root>()({
  data: {
    num: 1,
  },
});
const chunk1 = SubComponent<Root, "chunk1">()({
  data: {
    chunk1_num: 1,
  },
});
const rootComponent = RootComponent()({
  properties: {
    list: Array,
  },
  data: {
    bool: true,
    str: "string",
    obj: {},
  },
});

DefineComponent({
  name: "test",
  // @ts-ignore
  subComponents: [chunk, chunk1],
});
