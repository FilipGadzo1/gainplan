import type { defaultNS, resources } from './index';

/**
 * Types every t() key against the Swedish resources, which are the source of
 * truth for the key shape. A typo or a key that only exists in one locale is a
 * compile error rather than a string that renders as its own key at runtime.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['sv'];
  }
}
