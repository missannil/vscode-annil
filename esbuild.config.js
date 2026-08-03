
//@ts-check
// 生产发布专用：将扩展打包为单一 bundle
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./_src/extension.ts'],
  outfile: './out/extension.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  mainFields: ['module', 'main'],
  external: ["vscode"],
  alias: {
    '#deps': './_src/utils/deps.ts',
  },
});

console.log('[esbuild] 生产打包完成 → out/extension.js');
