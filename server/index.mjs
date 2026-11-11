import http from 'node:http';
import appInfo from '../package.json' with {type:'json'};
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {manualBackups,fileError} from './manual-backups.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore, uid } from './storage.mjs';
const appRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=process.env.TOPARROW_DATA_DIR;
const port=Number(process.env.TOPARROW_APP_PORT);
if(!root || !path.isAbsolute(root) || !Number.isInteger(port) || port<1 || port>65535) throw Error('请从顶箭启动：需要有效的 TOPARROW_DATA_DIR 和 TOPARROW_APP_PORT');
const store=openStore(root);
const backups=manualBackups(root,store);
let maintenance=false;
function ready(){if(maintenance)throw Error('正在备份或恢复，请稍后重试');}
async function exclusive(fn){ready();maintenance=true;try{return await fn();}finally{maintenance=false;}}
async function openBackupFolder(name){const file=backups.resolve(name);const runtime=process.env.TOPARROW_RUNTIME_DIR||path.resolve(path.dirname(process.execPath),process.platform==='darwin'?'../..':'..');const executable=process.platform==='darwin'?path.join(runtime,'electron','Electron.app','Contents','MacOS','Electron'):process.platform==='win32'?path.join(runtime,'electron','electron.exe'):null;if(!executable||!fs.existsSync(executable))throw Error('顶箭桌面运行时不可用，无法打开目录');const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;await promisify(execFile)(executable,[path.join(appRoot,'server','open-folder.cjs'),path.dirname(file)],{cwd:root,env,timeout:20000,windowsHide:true});return {ok:true};}
const safePhoto=p=>typeof p==='string'&&/^photos\/[a-f0-9-]+\.(jpg|png|webp)$/.test(p);
const send=(res,status,data,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(type.startsWith('application/json')?JSON.stringify(data):data);};
async function body(req,max=45*1024*1024){const parts=[];let n=0;for await(const b of req){n+=b.length;if(n>max)throw Error('文件超过大小限制');parts.push(b);}return Buffer.concat(parts);}
const json=async req=>{const value=JSON.parse((await body(req)).toString('utf8'));ready();return value;};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.otf':'font/otf','.woff2':'font/woff2','.woff':'font/woff','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try {
 const url=new URL(req.url,'http://localhost'),p=url.pathname;
 if(!/^((127\.0\.0\.1|localhost)(:\d+)?)$/.test(req.headers.host||''))return send(res,403,{error:'请求地址无效'});
 if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return send(res,403,{error:'禁止跨站请求'});
 if(p==='/__health')return send(res,200,{ok:true});
 if(p.startsWith('/api/')){
 ready();
 if(req.method!=='GET'&&req.headers['x-fitnote-request']!=='local')return send(res,403,{error:'请求校验失败'});
 if(p==='/api/bootstrap'&&req.method==='GET')return send(res,200,{orders:store.list(),settings:store.settings(),dataDir:root,appVersion:appInfo.version});
 if(p==='/api/backups'&&req.method==='GET')return send(res,200,backups.list());
 if(p==='/api/backups'&&req.method==='POST'){await json(req);return send(res,201,await exclusive(()=>backups.create()));}
 if(p==='/api/backups/import'&&req.method==='POST'){const bytes=await body(req,200*1024*1024);ready();return send(res,200,await exclusive(()=>backups.restore(bytes)));}
 const backupMatch=p.match(/^\/api\/backups\/([^/]+)(?:\/(open-folder))?$/);
 if(backupMatch){const name=decodeURIComponent(backupMatch[1]);if(req.method==='DELETE'&&!backupMatch[2])return send(res,200,backups.remove(name));if(req.method==='POST'&&backupMatch[2])return send(res,200,await openBackupFolder(name));}
 if(p==='/api/orders'&&req.method==='POST')return send(res,201,store.create(await json(req)));
 let match=p.match(/^\/api\/versions\/([a-f0-9-]+)(?:\/(finalize|next))?$/);
 if(match){const [,id,action]=match;if(req.method==='GET'&&!action){const v=store.version(id);return send(res,v?200:404,v||{error:'修改单不存在'});}if(req.method==='PUT'&&!action){const b=await json(req);return send(res,200,store.save(id,b.document,b.revision));}if(req.method==='POST'&&action==='finalize')return send(res,200,store.finalize(id,(await json(req)).revision));if(req.method==='POST'&&action==='next')return send(res,201,store.next(id));}
 match=p.match(/^\/api\/orders\/([a-f0-9-]+)\/(history|archive)$/);
 if(match&&match[2]==='history'&&req.method==='GET')return send(res,200,store.history(match[1]));
 if(match&&match[2]==='archive'&&req.method==='POST'){store.archive(match[1],(await json(req)).archived);return send(res,200,{ok:true});}

 const deleteMatch=p.match(/^\/api\/orders\/([a-f0-9-]+)$/);
 if(deleteMatch&&req.method==='DELETE'){const request=await json(req);const info=store.deletionInfo(deleteMatch[1]);if(request.number!==info.number)throw Error('修改单编号已变化，请重新打开后删除');const deleted=store.deleteArchived(deleteMatch[1],info.stamp);const used=new Set(store.db.prepare('SELECT document FROM versions').all().flatMap(v=>JSON.parse(v.document).photos.map(p=>p.path)));let cleanupWarnings=0;for(const photo of deleted.photos)if(!used.has(photo)){try{if(!safePhoto(photo))throw Error('照片路径无效');fs.rmSync(path.join(root,photo),{force:true});}catch{cleanupWarnings++;}}return send(res,200,{number:deleted.number,cleanupWarnings});}
 if(p==='/api/settings'&&req.method==='PUT'){store.setSettings(await json(req));return send(res,200,store.settings());}
 if(p==='/api/photos'&&req.method==='POST'){
 const b=await body(req,15*1024*1024);ready();let ext;if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';else if(b[0]===255&&b[1]===216&&b[2]===255)ext='jpg';else if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')ext='webp';else throw Error('仅支持有效的 JPG、PNG、WebP 照片');const rel=`photos/${uid()}.${ext}`;fs.writeFileSync(path.join(root,rel),b);return send(res,201,{path:rel});}
 if(p==='/api/photo'&&req.method==='GET'){const rel=url.searchParams.get('path');if(!safePhoto(rel)||!fs.existsSync(path.join(root,rel)))return send(res,404,{error:'照片文件已丢失'});return send(res,200,fs.readFileSync(path.join(root,rel)),mime[path.extname(rel)]);}
 if(p==='/api/export'&&req.method==='POST'){
 const b=await json(req);if(typeof b.pdf!=='string'||b.pdf.length>55*1024*1024)throw Error('PDF 文件过大');const bytes=Buffer.from(b.pdf,'base64');if(bytes.toString('ascii',0,5)!=='%PDF-')throw Error('PDF 文件无效');const name=String(b.name||'修改单.pdf').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,150).replace(/\.pdf$/i,'')+'.pdf';const temp=path.join(root,'exports',`${uid()}.tmp`),dest=path.join(root,'exports',name);fs.writeFileSync(temp,bytes);fs.renameSync(temp,dest);return send(res,200,{name});}
 return send(res,404,{error:'接口不存在'});
 }
 if(req.method!=='GET')return send(res,405,{error:'不支持此操作'});
 const build=path.join(appRoot,'build');let rel=decodeURIComponent(p).replace(/^\/+/,''),file=path.resolve(build,rel||'index.html');
 if(!file.startsWith(build+path.sep))return send(res,403,{error:'路径无效'});
 if(!fs.existsSync(file)){if(path.extname(rel))return send(res,404,{error:'资源不存在'});file=path.join(build,'index.html');}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(res,404,{error:'请先构建应用'});
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; frame-src 'self' blob:; worker-src 'self' blob:; object-src blob:; base-uri 'none'; frame-ancestors 'self'");
 return send(res,200,fs.readFileSync(file),mime[path.extname(file)]||'application/octet-stream');
 }catch(error){const e=fileError(error);console.error(new Date().toISOString(),e.message);if(!res.headersSent)send(res,400,{error:/UNIQUE constraint/.test(e.message)?'修改单编号已存在，请更换编号':e.message||'操作失败，请重试'});else res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`FitNote ready on 127.0.0.1:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{store.db.close();process.exit(0);}));
