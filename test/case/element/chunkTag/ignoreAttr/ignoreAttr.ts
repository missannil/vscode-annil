/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

const chunk = SubComponent<Root>()({
  data: {
    num: 123,
  },
});

DefineComponent({
  name: "test",
  // @ts-ignore
  subComponents: [chunk],
});
