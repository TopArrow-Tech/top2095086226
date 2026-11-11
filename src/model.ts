import {tr,translateMessage} from './i18n';
export const garmentTypes=['西装上衣','衬衫','西裤','连衣裙','婚纱礼服','燕尾服','T恤衫'];
export const typeKeys:Record<string,string>={'西装上衣':'suit','衬衫':'shirt','西裤':'trousers','连衣裙':'dress','婚纱礼服':'bridal','燕尾服':'tailcoat','T恤衫':'tshirt'};
export const statuses=['待处理','修改中','已完成','需复核'];
export const actions=['收窄','放宽','缩短','加长','抬高','降低','调整位置','重新缝制','其他'];
export const parts:Record<string,string[]>={'燕尾服':['左肩','右肩','领口','驳头','胸围','腰围','前衣长','后背','燕尾','开衩','左袖','右袖','袖口'],'T恤衫':['领口','左肩','右肩','胸围','腰围','衣长','袖长','袖口','下摆'],'西装上衣':['左肩','右肩','领口','胸围','腰围','衣长','左袖','右袖','袖口','后背','开衩'],'衬衫':['领围','左肩','右肩','胸围','腰围','衣长','袖长','袖口'],'西裤':['腰围','臀围','裆部','大腿围','膝围','裤长','裤脚'],'连衣裙':['肩部','领口','胸围','腰围','臀围','裙长','袖长','拉链'],'婚纱礼服':['肩带','领口','胸围','腰围','臀围','裙长','拖尾','拉链']};
export type View='front'|'back';
export interface Item {id:string;number:number;view:View;x:number;y:number;part:string;action:string;value:string;unit:string;basis:string;note:string;status:string;cancelled:boolean}
export interface Annotation {id:string;x:number;y:number;w:number;h:number;text:string;itemIds:string[]}
export interface Photo {id:string;path:string;name:string;note:string;annotations:Annotation[]}
export interface Doc {number:string;customer:string;contact:string;type:string;name:string;date:string;operator:string;note:string;templateVersion:number;items:Item[];photos:Photo[]}
export interface Version {id:string;order_id:string;seq:number;parent_id:string|null;state:'draft'|'final';revision:number;document:Doc;created_at:string;updated_at:string}
export interface Order {id:string;number:string;archived:number;version_id:string;seq:number;state:string;created_at:string;updated_at:string;document:Doc}
export interface Settings {studio?:string;unit?:string;header?:string;locale?:'zh-CN'|'en-US'}
export const uid=()=>crypto.randomUUID();
export const today=()=>new Date().toLocaleDateString('sv-SE');
export const template=(type:string,view:View,version=1)=>`/templates/${typeKeys[type]}-v${version}-${view}.svg`;
export const photoUrl=(p:Photo)=>`/api/photo?path=${encodeURIComponent(p.path)}`;
export const statusOf=(d:Doc)=>{const a=d.items.filter(i=>!i.cancelled);return a.length&&a.every(i=>i.status==='已完成')?'已完成':a.some(i=>i.status==='需复核')?'需复核':a.some(i=>i.status==='修改中')?'修改中':'待处理';};
export function blank():Doc{return {number:`FN-${today().replaceAll('-','')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,customer:'',contact:'',type:'西装上衣',name:'',date:today(),operator:'',note:'',templateVersion:1,items:[],photos:[]};}
export async function api<T=any>(url:string,method='GET',data?:unknown):Promise<T>{const r=await fetch('/api/'+url,{method,headers:{'Content-Type':'application/json','X-FitNote-Request':'local'},body:data===undefined?undefined:JSON.stringify(data)});const b=await r.json();if(!r.ok)throw Error(translateMessage(b.error||tr('ui.operationFailed')));return b;}
export const download=(blob:Blob,name:string)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
export async function fileData(file:Blob){return new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(Error(tr('ui.couldNotReadFile')));r.readAsDataURL(file);});}
export function diff(a:Doc,b:Doc){return b.items.map(i=>{const prev=a.items.find(p=>p.id===i.id);let kind='未变化';if(!prev)kind='新增';else if(i.cancelled&&!prev.cancelled)kind='取消';else if(i.status==='已完成'&&prev.status!=='已完成')kind='完成';else if(JSON.stringify(prev)!==JSON.stringify(i))kind='调整';return {item:i,prev,kind};}).concat(a.items.filter(i=>!b.items.some(p=>p.id===i.id)).map(i=>({item:i,prev:i,kind:'取消'})));}
