/* eslint-disable @typescript-eslint/no-unused-vars */

const root = RootComponent()({
  customEvents: {
    onCustomTap: String,
  },
  data: {
    aaa: "aaa",
  },
  computed: {
    height() {
      return 100;
    },
  },
});
