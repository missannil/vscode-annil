/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

import type { $SubA } from "../../mockComponents/subA";

const subA = SubComponent<Root, $SubA>()({});

const subAXx = SubComponent<Root, $SubA, "xx">()({});
