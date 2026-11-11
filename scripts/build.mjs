import {build as viteBuild} from 'vite';
import {build as esbuild} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
fs.copyFileSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs','public/pdf-worker.js');
await viteBuild();
await esbuild({entryPoints:['server/index.mjs'],outfile:'server/standalone.mjs',bundle:true,platform:'node',format:'esm',target:'node24',legalComments:'linked'});
fs.mkdirSync('licenses',{recursive:true});
const dependencies=['react','react-dom','scheduler','lucide-react','pdf-lib','@pdf-lib/fontkit','@pdf-lib/standard-fonts','@pdf-lib/upng','pako','tslib','fflate','pdfjs-dist'];
for(const name of dependencies){const base=path.join('node_modules',name);for(const file of ['LICENSE','LICENSE.md','LICENSE.txt','LICENSE-MIT','COPYING']){const src=path.join(base,file);if(fs.existsSync(src)){fs.copyFileSync(src,path.join('licenses',name.replaceAll('/','-').replace('@','')+'-'+file));break;}}}
console.log('前端、离线资源、独立 Node 服务与许可证已构建。');
