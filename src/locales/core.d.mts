export type Locale = 'zh-CN' | 'en-US';
export type Params = Record<string, string | number>;
export const locales: Locale[];
export function translate(locale: Locale, key: string, params?: Params): string;
export function label(value: string, locale: Locale): string;
export function canonical(value: string): string;
export function translateMessage(message: string, locale: Locale): string;
