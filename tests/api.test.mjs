import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {once} from 'node:events';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'fitnote-api-'));
const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
let child;
async function start(){child=spawn(process.execPath,[process.env.FITNOTE_TEST_ENTRY||'server/index.mjs'],{env:{...process.env,TOPARROW_DATA_DIR:root,TOPARROW_APP_PORT:String(port)},stdio:['ignore','pipe','pipe']});let out='';await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('startup timeout')),10000);child.stdout.on('data',b=>{out+=b;if(out.includes('ready')){clearTimeout(timer);resolve();}});child.on('exit',code=>reject(Error('server exited '+code)));});}
async function stop(){if(child.exitCode===null){child.kill();await once(child,'exit');}}
await start();
const url=`http://127.0.0.1:${port}`;
async function request(p,method='GET',data,headers={}){const r=await fetch(url+p,{method,headers:{'X-FitNote-Request':'local','Content-Type':'application/json',...headers},body:data===undefined?undefined:JSON.stringify(data)});return{status:r.status,body:await r.json()};}
await test('HTTP 完整验收：保存重启、PDF 存储、照片、归档删除与已移除接口',async t=>{
 t.after(async()=>{await stop();fs.rmSync(root,{recursive:true,force:true});});
 assert.equal((await request('/__health')).status,200);
 assert.equal((await request('/api/bootstrap')).body.appVersion,JSON.parse(fs.readFileSync('package.json')).version);
 const worker=await fetch(url+'/pdf-worker.js');assert.equal(worker.status,200);assert.match(worker.headers.get('content-type'),/javascript/);assert.match(await worker.text(),/pdfjs|PDF/);
 const home=await fetch(url+'/');assert.equal(home.status,200);assert.match(await home.text(),/assets\/index/);
 const d={number:'FN-ACCEPTANCE',customer:'验收客户',contact:'',type:'西装上衣',name:'藏青西装',date:'2026-11-10',operator:'验收',note:'',templateVersion:1,items:[{id:'left-shoulder',number:1,view:'front',x:.35,y:.2,part:'左肩',action:'收窄',value:'1',unit:'cm',basis:'单侧',note:'',status:'待处理',cancelled:false},{id:'sleeve',number:2,view:'front',x:.1,y:.55,part:'袖口',action:'缩短',value:'1.5',unit:'cm',basis:'未指定',note:'',status:'待处理',cancelled:false}],photos:[]};
 let r=await request('/api/orders','POST',d);assert.equal(r.status,201);let v=r.body;
 assert.equal((await request('/api/settings','PUT',{locale:'en-US'})).body.locale,'en-US');
 assert.equal((await request('/api/settings','PUT',{locale:'fr-FR'})).status,400);
 assert.equal((await request('/api/orders/'+v.order_id+'/archive','POST',{archived:true})).status,200);
 assert.equal((await request('/api/bootstrap')).body.orders[0].archived,1);
 assert.deepEqual((await request('/api/versions/'+v.id)).body.document,d);
 assert.equal((await request('/api/orders/'+v.order_id+'/archive','POST',{archived:false})).status,200);
 await stop();await start();assert.equal((await request('/api/bootstrap')).body.settings.locale,'en-US');assert.deepEqual((await request('/api/versions/'+v.id)).body.document,d);
 const uploaded=await fetch(url+'/api/photos',{method:'POST',headers:{'X-FitNote-Request':'local'},body:fs.readFileSync('icon.png')});assert.equal(uploaded.status,201);const p=await uploaded.json();d.photos=[{id:'photo-1',path:p.path,name:'验收照片.png',note:'保留原图',annotations:[{id:'a1',x:.1,y:.1,w:.2,h:.2,text:'左肩褶皱',itemIds:['left-shoulder']}]}];
 v=(await request('/api/versions/'+v.id,'PUT',{document:d,revision:v.revision})).body;
 assert.equal((await fetch(url+'/api/photo?path='+p.path)).status,200);
 const saved=await request('/api/export','POST',{name:'验收_西装_V1.pdf',pdf:Buffer.from('%PDF-1.7\nvalidation').toString('base64')});assert.equal(saved.status,200);assert(fs.existsSync(path.join(root,'exports',saved.body.name)));
 for(const [p,m] of [['/api/backup','POST'],['/api/backup-status','GET'],['/api/backups/open-folder','POST'],['/api/backups/fitnote-latest-auto.zip/file','GET'],['/api/backups/fitnote-old.zip/restore','POST'],['/api/restore','POST']])assert.equal((await request(p,m,m==='POST'?{}:undefined)).status,404,p);
 assert.deepEqual((await request('/api/backups')).body,[]);assert(!fs.existsSync(path.join(root,'backups')));
 const manual=await request('/api/backups','POST',{});assert.equal(manual.status,201,JSON.stringify(manual.body));const backupPath=path.join(root,'backups',manual.body.name),backupBytes=fs.readFileSync(backupPath);assert.equal((await request('/api/backups')).body.length,1);
 await request('/api/orders','POST',{...d,number:'TEMPORARY'});const imported=await fetch(url+'/api/backups/import',{method:'POST',headers:{'X-FitNote-Request':'local'},body:backupBytes});assert.equal(imported.status,200,await imported.text());assert.equal((await request('/api/bootstrap')).body.orders.length,1);v=(await request('/api/versions/'+v.id)).body;
 fs.unlinkSync(backupPath);assert.equal((await request('/api/backups')).body.length,0);const nextManual=(await request('/api/backups','POST',{})).body;assert.equal((await request('/api/backups/'+encodeURIComponent(nextManual.name),'DELETE')).status,200);assert.equal((await request('/api/backups')).body.length,0);
 assert.deepEqual((await request('/api/versions/'+v.id)).body.document,d);
 assert.equal((await request('/api/settings','PUT',{studio:'bad'},{Origin:'http://evil.invalid'})).status,403);
 assert.equal((await fetch(url+'/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
 const badPhoto=await fetch(url+'/api/photos',{method:'POST',headers:{'X-FitNote-Request':'local'},body:'invalid image'});assert.equal(badPhoto.status,400);
 assert.equal((await fetch(url+'/api/photo?path=../../manifest.json')).status,404);
 assert.equal((await request('/api/orders','POST',{...d,number:'EMPTY',items:[],photos:[]})).status,201);
 const uniquePhoto=await fetch(url+'/api/photos',{method:'POST',headers:{'X-FitNote-Request':'local'},body:fs.readFileSync('icon.png')});const uniquePath=(await uniquePhoto.json()).path;
 const target=(await request('/api/orders','POST',{...d,number:'FN-DELETE-SAFETY',photos:[...d.photos,{...d.photos[0],id:'unique-photo',path:uniquePath}]})).body;
 assert.equal((await request('/api/orders/'+target.order_id,'DELETE',{number:'FN-DELETE-SAFETY'})).status,400);
 await request('/api/versions/'+target.id+'/finalize','POST',{revision:target.revision});const second=(await request('/api/versions/'+target.id+'/next','POST',{})).body;
 await request('/api/orders/'+target.order_id+'/archive','POST',{archived:true});
 assert.equal((await request('/api/orders/'+target.order_id,'DELETE',{number:'WRONG'})).status,400);
 const deleted=await request('/api/orders/'+target.order_id,'DELETE',{number:'FN-DELETE-SAFETY'});assert.equal(deleted.status,200,JSON.stringify(deleted.body));assert.equal(deleted.body.safetyBackup,undefined);assert.equal(deleted.body.cleanupWarnings,0);assert.equal((await fetch(url+'/api/photo?path='+uniquePath)).status,404);
 assert.equal((await request('/api/versions/'+target.id)).status,404);assert.equal((await request('/api/versions/'+second.id)).status,404);assert.equal((await request('/api/orders/'+target.order_id+'/history')).body.length,0);
 assert.equal((await fetch(url+'/api/photo?path='+p.path)).status,200);
 assert.equal(fs.readdirSync(path.join(root,'backups')).length,0);
 await stop();await start();assert.equal(fs.readdirSync(path.join(root,'backups')).length,0);assert.deepEqual((await request('/api/versions/'+v.id)).body.document,d);

});
