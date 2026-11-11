import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export const uid = () => randomUUID();
export const now = () => new Date().toISOString();
export const types = ['西装上衣','衬衫','西裤','连衣裙','婚纱礼服','燕尾服','T恤衫'];
export function validateDocument(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.items) || d.items.length > 500) throw Error('修改项目格式无效或超过 500 项');
  for (const k of ['number','customer','type','name','date','operator','note']) if (typeof d[k] !== 'string' || d[k].length > (k==='note'?5000:200)) throw Error('基本资料格式无效');
  if (!d.number.trim() || !d.customer.trim() || !types.includes(d.type) || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) throw Error('请填写编号、客户、服装类型和有效日期');
  if (d.templateVersion!==1) throw Error('服装模板版本不支持');
  if (d.contact != null && (typeof d.contact !== 'string' || d.contact.length > 200)) throw Error('联系方式格式无效');
  const ids=new Set(), numbers=new Set();
  for (const i of d.items) {
    if (!i || typeof i.id !== 'string' || ids.has(i.id) || !Number.isInteger(i.number) || i.number<1 || numbers.has(i.number)) throw Error('修改项目编号重复或无效');
    ids.add(i.id); numbers.add(i.number);
    if (!['front','back'].includes(i.view) || !Number.isFinite(i.x) || !Number.isFinite(i.y) || i.x<0 || i.x>1 || i.y<0 || i.y>1) throw Error('标记坐标超出图纸');
    if (!['待处理','修改中','已完成','需复核'].includes(i.status) || !['cm','mm','in'].includes(i.unit)) throw Error('项目状态或单位无效');
    for (const k of ['part','action','value','note','basis']) if (typeof i[k] !== 'string' || i[k].length>5000) throw Error('修改项目文字无效');
    if (i.value && !/^\d{1,5}(\.\d{1,3})?$/.test(i.value)) throw Error('修改数值需为非负数字，最多三位小数');
    if (typeof i.cancelled !== 'boolean') throw Error('修改项目取消状态无效');
  }
  if (!Array.isArray(d.photos) || d.photos.length>100) throw Error('照片数量超过限制');
  for (const p of d.photos) {
    if (!p || typeof p.id!=='string' || !/^photos\/[a-f0-9-]+\.(jpg|png|webp)$/.test(p.path) || !Array.isArray(p.annotations) || p.annotations.length>300 || typeof p.note!=='string' || p.note.length>5000) throw Error('照片记录无效');
    for(const a of p.annotations) {
      if(!a || typeof a.id!=='string' || typeof a.text!=='string' || a.text.length>5000 || !Array.isArray(a.itemIds) || a.itemIds.some(id=>!ids.has(id))) throw Error('照片标注关联无效');
      for(const k of ['x','y','w','h']) if(!Number.isFinite(a[k]) || a[k]<0 || a[k]>1) throw Error('照片区域坐标无效');
      if(a.x+a.w>1.001 || a.y+a.h>1.001) throw Error('照片区域超出图片');
    }
  }
}
export function openStore(root) {
  for (const d of ['database','photos','exports','logs']) mkdirSync(path.join(root,d),{recursive:true});
  const db=new DatabaseSync(path.join(root,'database','fitnote.db'));
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE, archived INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS versions(id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), seq INTEGER NOT NULL, parent_id TEXT REFERENCES versions(id), state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','final')), revision INTEGER NOT NULL DEFAULT 1, document TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(order_id,seq));
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    INSERT OR IGNORE INTO migrations VALUES(1,datetime('now'));`);
  const read=v=>v?{...v,document:JSON.parse(v.document)}:null;
  const version=id=>read(db.prepare('SELECT * FROM versions WHERE id=?').get(id));
  const tx=fn=>{db.exec('BEGIN IMMEDIATE');try {const r=fn();db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}};
  const deletionInfo=id=>{const order=db.prepare('SELECT * FROM orders WHERE id=?').get(id);if(!order)throw Error('修改单不存在');if(!order.archived)throw Error('请先归档修改单，再执行删除');return {number:order.number,stamp:JSON.stringify([order,db.prepare('SELECT id,revision,seq FROM versions WHERE order_id=? ORDER BY seq').all(id)])};};
  return {db,version,deletionInfo,
    deleteArchived(id,expectedStamp){return tx(()=>{const current=deletionInfo(id);if(current.stamp!==expectedStamp)throw Error('单据已发生变化，请重新打开后重试');const photos=[...new Set(db.prepare('SELECT document FROM versions WHERE order_id=?').all(id).flatMap(v=>JSON.parse(v.document).photos.map(p=>p.path)))];db.prepare('DELETE FROM versions WHERE order_id=?').run(id);db.prepare('DELETE FROM orders WHERE id=?').run(id);return {number:current.number,photos};});},
    list(){return db.prepare(`SELECT o.*,v.id as version_id,v.seq,v.state,v.document FROM orders o JOIN versions v ON v.order_id=o.id WHERE v.seq=(SELECT MAX(seq) FROM versions WHERE order_id=o.id) ORDER BY o.updated_at DESC`).all().map(x=>({...x,document:JSON.parse(x.document)}));},
    history(id){return db.prepare('SELECT * FROM versions WHERE order_id=? ORDER BY seq DESC').all(id).map(read);},
    create(d){validateDocument(d);return tx(()=>{const id=uid(),vid=uid(),t=now();db.prepare('INSERT INTO orders VALUES(?,?,0,?,?)').run(id,d.number,t,t);db.prepare('INSERT INTO versions VALUES(?,?,1,NULL,\'draft\',1,?,?,?)').run(vid,id,JSON.stringify(d),t,t);return version(vid);});},
    save(id,d,revision){validateDocument(d);return tx(()=>{const v=version(id);if(!v)throw Error('修改单不存在');if(v.state!=='draft')throw Error('历史定稿不可修改，请创建新试衣版本');if(v.revision!==revision)throw Error('记录已在其他窗口更新，请重新打开后编辑');const t=now();db.prepare('UPDATE orders SET number=?,updated_at=? WHERE id=?').run(d.number,t,v.order_id);db.prepare('UPDATE versions SET document=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(d),t,id);return version(id);});},
    finalize(id,revision){return tx(()=>{const v=version(id);if(!v || v.revision!==revision)throw Error('保存版本已变化，请重新打开');if(v.state==='final')return v;db.prepare("UPDATE versions SET state='final', revision=revision+1,updated_at=? WHERE id=?").run(now(),id);return version(id);});},
    next(id){return tx(()=>{const v=version(id);if(!v || v.state!=='final')throw Error('请先定稿当前试衣记录');if(db.prepare('SELECT MAX(seq) as n FROM versions WHERE order_id=?').get(v.order_id).n!==v.seq)throw Error('请从最新版本创建新试衣');const vid=uid(),t=now(),d=structuredClone(v.document);d.date=new Date().toLocaleDateString('sv-SE');db.prepare("INSERT INTO versions VALUES(?,?,?,?,'draft',1,?,?,?)").run(vid,v.order_id,v.seq+1,id,JSON.stringify(d),t,t);db.prepare('UPDATE orders SET updated_at=? WHERE id=?').run(t,v.order_id);return version(vid);});},
    archive(id,archived){db.prepare('UPDATE orders SET archived=?,updated_at=? WHERE id=?').run(archived?1:0,now(),id);},
    settings(){return Object.fromEntries(db.prepare('SELECT * FROM settings').all().map(x=>[x.key,JSON.parse(x.value)]));},
    setSettings(s){tx(()=>{for(const k of ['studio','unit','header','locale'])if(k in s){if(typeof s[k]!=='string' || s[k].length>500)throw Error('设置内容无效');if(k==='locale'&&!['zh-CN','en-US'].includes(s[k]))throw Error('语言设置无效');if(k==='unit'&&!['cm','mm','in'].includes(s[k]))throw Error('单位无效');db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k,JSON.stringify(s[k]));}});}
  };
}
