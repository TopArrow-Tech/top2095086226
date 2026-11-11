import fs from 'node:fs';import path from 'node:path';import {zipSync,strToU8} from 'fflate';
const data=process.env.TOPARROW_DATA_DIR;
if(!data||!path.isAbsolute(data))throw Error('请指定 TOPARROW_DATA_DIR，打包产物写入其 exports 目录');
for(const required of ['manifest.json','icon.png','build/index.html','server/standalone.mjs'])if(!fs.existsSync(required))throw Error('缺少构建文件：'+required+'，请先执行构建');
const files={};function add(file){const st=fs.statSync(file);if(st.isDirectory()){for(const name of fs.readdirSync(file))add(path.join(file,name));}else{const rel=file.split(path.sep).join('/');if(rel.length>200||st.size>256*1024*1024)throw Error('文件超出平台限制：'+rel);files[rel]=new Uint8Array(fs.readFileSync(file));}}
for(const p of ['manifest.json','icon.png','build','licenses'])add(p);
add('server/standalone.mjs');add('server/open-folder.cjs');if(fs.existsSync('server/standalone.mjs.LEGAL.txt'))add('server/standalone.mjs.LEGAL.txt');
if(Object.keys(files).length>20000||Object.values(files).reduce((n,b)=>n+b.length,0)>1024**3)throw Error('发布包体积或文件数量超出限制');
const out=path.join(data,'exports','FitNote-发布包.zip');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,zipSync(files,{level:6}));
console.log('发布包已生成：'+out);console.log('白名单打包：不包含用户数据、开发依赖、运行时、Git 或文档。');
