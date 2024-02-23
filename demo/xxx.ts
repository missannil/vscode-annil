// @ts-nocheck

const h_image = SubComponent<Main, $Image>()({
	inherit: {
	  image_height: "imaddgeSize",
	  image_width: "imageSize",
	  image_src: "wxml",
	},
	data: {
	  iamge_ariaDisabled:123,
	  image_xxx: 123,
	  image_yyy: 456,
	},
	events: {
	  image_zzz(e) {
	  },
	  image_eee_catch(e) {},
	},
  });