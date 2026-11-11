import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync,backup} from 'node:sqlite';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {uid,validateDocument} from './storage.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const photo=p=>/^photos\/[a-f0-9-]+\.(jpg|png|webp)$/.test(p);
const validName=n=>typeof n==='string'&&/^衣改备份_[0-9T_-]+_[a-f0-9]{8}\.fitbackup$/.test(n);
const capacity='备份超出容量限制（文件 200MB，原始数据 400MB）';
export function fileError(e){if(['ENOSPC','EDQUOT'].includes(e.code))return Error('磁盘空间不足，操作未完成');if(['EACCES','EPERM','EROFS'].includes(e.code))return Error('目录不可写或权限不足，操作未完成');return e;}
export function manualBackups(root,store){
 const dir=path.join(root,'backups');
 function directory(create=false){if(create)fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(dir))return false;const stat=fs.lstatSync(dir);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('备份目录无效');return true;}
 function target(name){if(!validName(name))throw Error('备份文件名无效');if(!directory())throw Error('备份文件不存在');const p=path.join(dir,name);if(!fs.existsSync(p)||!fs.lstatSync(p).isFile()||fs.lstatSync(p).isSymbolicLink())throw Error('备份文件不存在');return p;}
 function decode(bytes){
  if(bytes.length>200*1024*1024)throw Error(capacity);let size=0,count=0,files;
  try{files=unzipSync(bytes,{filter:f=>{size+=f.originalSize;count++;if(size>400*1024*1024||count>10000)throw Error(capacity);return true;}});}catch(e){if(e.message===capacity)throw e;throw Error('不是有效的衣改备份文件');}
  if(!files['manifest.json']||!files['database/fitnote.db'])throw Error('不是有效的衣改备份文件');let m;try{m=JSON.parse(strFromU8(files['manifest.json']));}catch{throw Error('备份文件校验失败');}
  if(m.format!=='fitnote-business-backup'||m.version!==1||!m.files||typeof m.files!=='object'||Array.isArray(m.files))throw Error('备份版本不支持');
  for(const [p,b] of Object.entries(files)){if(p==='manifest.json')continue;if(p!=='database/fitnote.db'&&!photo(p))throw Error('备份包含不允许的路径');if(m.files[p]!==hash(b))throw Error('备份文件校验失败');}
  for(const p of Object.keys(m.files))if(!files[p]||p==='manifest.json')throw Error('备份文件不完整');return files;
 }
 async function create(){
  directory(true);if(fs.lstatSync(path.join(root,'photos')).isSymbolicLink())throw Error('照片路径无效');const temp=path.join(dir,uid()+'.db'),partial=path.join(dir,uid()+'.partial');
  try{
   await backup(store.db,temp);const files={'database/fitnote.db':new Uint8Array(fs.readFileSync(temp))};let size=files['database/fitnote.db'].length,count=1;const snapshot=new DatabaseSync(temp,{readOnly:true});
   try{for(const row of snapshot.prepare('SELECT document FROM versions').all())for(const p of JSON.parse(row.document).photos){if(!photo(p.path))throw Error('照片路径无效');if(files[p.path])continue;const actual=path.join(root,p.path);if(!fs.existsSync(actual))throw Error('照片附件缺失，无法完成备份');const st=fs.lstatSync(actual);if(!st.isFile()||st.isSymbolicLink()||fs.realpathSync(path.dirname(actual))!==fs.realpathSync(path.join(root,'photos')))throw Error('照片路径无效');size+=st.size;count++;if(size>400*1024*1024||count>9999)throw Error(capacity);files[p.path]=new Uint8Array(fs.readFileSync(actual));}}finally{snapshot.close();}
   files['manifest.json']=strToU8(JSON.stringify({format:'fitnote-business-backup',version:1,createdAt:new Date().toISOString(),files:Object.fromEntries(Object.entries(files).map(([p,b])=>[p,hash(b)]))}));if(size+files['manifest.json'].length>400*1024*1024)throw Error(capacity);const bytes=zipSync(files,{level:1});if(bytes.length>200*1024*1024)throw Error(capacity);
   fs.writeFileSync(partial,bytes,{flag:'wx'});decode(fs.readFileSync(partial));const date=new Date(),pad=n=>String(n).padStart(2,'0');const stamp=[date.getFullYear(),pad(date.getMonth()+1),pad(date.getDate())].join('-')+'_'+[pad(date.getHours()),pad(date.getMinutes()),pad(date.getSeconds())].join('');const name=`衣改备份_${stamp}_${uid().slice(0,8)}.fitbackup`;fs.renameSync(partial,path.join(dir,name));return {name,size:bytes.length};
  }catch(e){throw fileError(e);}finally{for(const p of [temp,temp+'-shm',temp+'-wal',partial])fs.rmSync(p,{force:true});}
 }
 function list(){if(!directory())return [];return fs.readdirSync(dir).filter(validName).flatMap(name=>{try{const s=fs.lstatSync(path.join(dir,name));return s.isFile()&&!s.isSymbolicLink()?[{name,size:s.size,createdAt:s.mtime.toISOString()}]:[];}catch(e){if(e.code==='ENOENT')return [];throw e;}}).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 async function restore(bytes){
  const files=decode(bytes);if(fs.lstatSync(path.join(root,'photos')).isSymbolicLink())throw Error('照片路径无效');const temp=path.join(root,'database',uid()+'.restore-db');let candidate,attached=false,committed=false;const copied=[];
  try{
   fs.writeFileSync(temp,files['database/fitnote.db'],{flag:'wx'});candidate=new DatabaseSync(temp,{readOnly:true});candidate.exec('PRAGMA trusted_schema=OFF');
   if(candidate.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||candidate.prepare('PRAGMA foreign_key_check').all().length)throw Error('数据库完整性校验失败');
   const migrations=candidate.prepare('SELECT version FROM migrations').all();if(migrations.length!==1||migrations[0].version!==1)throw Error('数据库版本不支持');
   for(const t of ['orders','versions','settings']){const expected=store.db.prepare(`PRAGMA table_info(${t})`).all().map(x=>x.name);const actual=candidate.prepare(`PRAGMA table_info(${t})`).all().map(x=>x.name);if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error('数据库版本不支持');}
   for(const row of candidate.prepare('SELECT document FROM versions').all()){const d=JSON.parse(row.document);validateDocument(d);for(const p of d.photos)if(!files[p.path])throw Error('备份缺少照片附件');}
   for(const {key,value} of candidate.prepare('SELECT * FROM settings').all()){const v=JSON.parse(value);if(!['studio','unit','header','locale'].includes(key)||typeof v!=='string'||v.length>500||(key==='unit'&&!['cm','mm','in'].includes(v))||(key==='locale'&&!['zh-CN','en-US'].includes(v)))throw Error('设置内容无效');}
   candidate.close();candidate=null;
   // Never overwrite an existing attachment. Remove newly copied files if the transaction fails.
   for(const [p,b] of Object.entries(files))if(photo(p)){const dest=path.join(root,p);if(fs.existsSync(dest)){const st=fs.lstatSync(dest);if(st.isSymbolicLink()||!st.isFile()||hash(fs.readFileSync(dest))!==hash(b))throw Error('附件与本机文件冲突，恢复已取消');}else{const fd=fs.openSync(dest,'wx');copied.push(dest);try{fs.writeFileSync(fd,b);}finally{fs.closeSync(fd);}}}
   store.db.prepare('ATTACH DATABASE ? AS restored').run(temp);attached=true;store.db.exec('BEGIN IMMEDIATE');
   try{const oldRevision=store.db.prepare('SELECT COALESCE(MAX(revision),0) AS n FROM versions').get().n;store.db.exec('DELETE FROM versions;DELETE FROM orders;DELETE FROM settings;INSERT INTO orders SELECT * FROM restored.orders;INSERT INTO versions SELECT * FROM restored.versions ORDER BY seq;INSERT INTO settings SELECT * FROM restored.settings;');store.db.prepare('UPDATE versions SET revision=revision+?').run(oldRevision+1);store.db.exec('COMMIT');committed=true;}catch(e){store.db.exec('ROLLBACK');throw e;}
   return {ok:true};
  }catch(e){throw fileError(e);}finally{candidate?.close();if(attached)store.db.exec('DETACH DATABASE restored');if(!committed)for(const p of copied)fs.rmSync(p,{force:true});for(const p of [temp,temp+'-shm',temp+'-wal'])fs.rmSync(p,{force:true});}
 }
 return {create,list,restore,directory:()=>directory(false)?dir:null,resolve:target,remove(name){try{fs.unlinkSync(target(name));return {ok:true};}catch(e){throw fileError(e);}}};
}
