// @ts-nocheck

const subA = SubComponent()({
  data: {
    subA_xXX: "normal",
  },
});

const root = RootComopnent()({
  data: {
    list: [1, 2, 3],
    noList: 123,
  },
  children: [subA, subB, subC],
});
