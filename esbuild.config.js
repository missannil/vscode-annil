
import * as esbuild from "esbuild";
import process from "node:process";

const isWatch = process.argv.includes("--watch");
/** @type {Readonly<esbuild.BuildOptions>} */
const options = {
  entryPoints: ["./_src/extension.ts"],
  outfile: "./out/extension.js",
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
}

if (isWatch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("[esbuild] 正在监听 _src/ 变化...");
} else {
  await esbuild.build(options);
}
