/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

const root = RootComponent()({
  customEvents: {
    onCustomTap: String,
    errCustomTap: String,
  },

  events: {
    onCustomCatchTap: String,
    errEvent: String,
  },
});
