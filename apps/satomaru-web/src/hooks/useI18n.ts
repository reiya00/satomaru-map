import { messages } from '../i18n/messages';

export const useI18n = () => {
  const t = (key: string, params?: Record<string, string>) => {
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    if (params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => str.replace(`{{${paramKey}}}`, paramValue),
        value
      );
    }
    
    return value;
  };
  
  return { t };
};
