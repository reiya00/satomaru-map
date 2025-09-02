import { messages } from '../i18n/messages';

type Messages = typeof messages;

type PathToString<T> = T extends string
  ? string
  : T extends Record<string, unknown>
    ? { [K in keyof T & string]: `${K}` | `${K}.${PathToString<T[K]>}` }[keyof T & string]
    : never;

export const useI18n = () => {
  const t = (key: PathToString<Messages>, params?: Record<string, string>) => {
    const keys = key.split('.') as string[];
    let value: unknown = messages as unknown;

    for (const k of keys) {
      if (typeof value !== 'object' || value === null) break;
      value = (value as Record<string, unknown>)[k];
    }

    if (typeof value !== 'string') {
      return key as string;
    }

    let out = value as string;
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        out = out.replace(`{{${paramKey}}}`, paramValue);
      }
    }
    return out;
  };

  return { t };
};
