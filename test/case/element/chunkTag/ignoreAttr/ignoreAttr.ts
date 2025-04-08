import { ChunkComponent, DefineComponent } from "annil";

const chunk = ChunkComponent<{}>()({
  data: {
    num: 123,
  },
});

DefineComponent({
  name: "test",
  subComponents: [chunk],
});
