import { CustomComponent } from "annil";
import type { $Page } from "components/page/page";

export const page = CustomComponent<{}, $Page>()({
  store: {
    page_style: () => "string",
  },
});
