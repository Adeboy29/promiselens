import {build} from 'esbuild';
import {copyFileSync} from 'node:fs';
await build({entryPoints:['src/app.js'],bundle:true,minify:true,format:'iife',platform:'browser',target:'es2022',outfile:'dist/app.js'});
copyFileSync('contracts/PromiseLens.py','dist/PromiseLens.py');
console.log('PromiseLens browser bundle and contract ready.');
