import {useSyncExternalStore} from 'react';
import {translate, label, canonical, translateMessage as message, type Locale, type Params} from './locales/core.mjs';
let locale:Locale = 'zh-CN';
const listeners=new Set<()=>void>();
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>listeners.delete(listener)};
export const getLocale=()=>locale;
export const useLanguage=()=>useSyncExternalStore(subscribe,getLocale,getLocale);
export function setLocale(next:string){
  const resolved:Locale=next==='en-US'?'en-US':'zh-CN';
  if(typeof document!=='undefined'){document.documentElement.lang=resolved;document.title=translate(resolved,'ui.fitnoteFittingAlterationsClearlyMarked');}
  if(locale!==resolved){locale=resolved;for(const listener of listeners)listener();}
}
export const tr=(key:string,params?:Params)=>translate(locale,key,params);
export const displayValue=(value:string)=>label(value,locale);
export const canonicalValue=(value:string)=>canonical(value);
export const translateMessage=(value:string)=>message(value,locale);
