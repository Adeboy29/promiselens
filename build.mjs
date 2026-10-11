import {build} from 'esbuild';

// Root output preserves the existing main / (root) GitHub Pages configuration.
await build({entryPoints:['app-source.js'],bundle:true,minify:true,format:'iife',platform:'browser',target:'es2022',outfile:'app.js'});

console.log('PromiseLens root publish assets rebuilt from tracked source.');
