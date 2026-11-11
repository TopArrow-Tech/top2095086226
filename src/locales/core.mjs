import zh from './zh-CN.json' with { type: 'json' };
import en from './en-US.json' with { type: 'json' };
import domainKeys from './domain-keys.json' with { type: 'json' };
const domainSet=new Set(domainKeys);
export const locales = ['zh-CN', 'en-US'];
const messages = { 'zh-CN': zh, 'en-US': en };
const sourceKeys = new Map(Object.entries(zh).map(([key, value]) => [value, key]));
const englishKeys = new Map(Object.entries(en).map(([key, value]) => [value, key]));
export function translate(locale, key, params = {}) {
  const resolvedKey=params.count===1&&messages[locale]?.[key+'.one']?key+'.one':key;
  const message = messages[locale]?.[resolvedKey] ?? zh[resolvedKey];
  if (message === undefined) throw new Error(`Unknown translation key: ${key}`);
  return message.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match);
}
export function label(value, locale) {
  const key = sourceKeys.get(value);
  return key && domainSet.has(key) ? translate(locale, key) : value;
}
export function canonical(value) {
  const key = englishKeys.get(value);
  return key && domainSet.has(key) ? zh[key] : value;
}
export function translateMessage(message, locale) {
  const key = sourceKeys.get(message) ?? englishKeys.get(message);
  return key ? translate(locale, key) : message;
}
