import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {translate,label,canonical,translateMessage} from '../src/locales/core.mjs';
const zh=JSON.parse(fs.readFileSync('src/locales/zh-CN.json','utf8'));
const en=JSON.parse(fs.readFileSync('src/locales/en-US.json','utf8'));
test('中英文消息齐全，所有代码引用及插值参数一致',()=>{
 assert.deepEqual(Object.keys(zh).sort(),Object.keys(en).sort());
 for(const key of Object.keys(zh)){assert.equal(typeof en[key],'string');assert(en[key].trim());const params=s=>[...s.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();assert.deepEqual(params(zh[key]),params(en[key]),key);}
 for(const file of fs.readdirSync('src').filter(f=>/\.(tsx?|mjs)$/.test(f))){const s=fs.readFileSync('src/'+file,'utf8');for(const m of s.matchAll(/\btr\(["']([^"']+)["']/g))assert(m[1] in zh,`${file}: ${m[1]}`);}
});
test('语言切换只翻译标准选项，自定义业务文字保持原文',()=>{
 assert.equal(label('西装上衣','en-US'),'Suit jacket');assert.equal(label('左肩','en-US'),'Left shoulder');assert.equal(label('收窄','en-US'),'Take in');assert.equal(label('已完成','en-US'),'Completed');
 assert.equal(canonical('Left shoulder'),'左肩');assert.equal(canonical('Take in'),'收窄');assert.equal(canonical('Shorten'),'缩短');assert.equal(canonical('Archive'),'Archive');
 assert.equal(label('客户特别要求保留缝份','en-US'),'客户特别要求保留缝份');assert.equal(label('Custom bias seam','zh-CN'),'Custom bias seam');
 assert.equal(translateMessage('修改单不存在','en-US'),'Record not found');assert.equal(translateMessage('Record not found','zh-CN'),'修改单不存在');
 const key=Object.keys(zh).find(k=>zh[k]==='PDF 第 {p0} 页');assert.equal(translate('en-US',key,{p0:3}),'PDF page 3');
});
