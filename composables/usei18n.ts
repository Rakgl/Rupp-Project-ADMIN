// composables/useI18n.ts
import { useI18n as useVueI18n } from 'vue-i18n';
import {
  useLocalePath as useNuxtLocalePath,
  useSwitchLocalePath as useNuxtSwitchLocalePath,
  useLocaleHead as useNuxtLocaleHead,
} from '#imports';

/**
 * A custom composable that bundles i18n functionalities.
 * This makes both vue-i18n and @nuxtjs/i18n helpers available
 * throughout the app without needing multiple imports.
 */
export function useCustomI18n() {
  const vueI18n = useVueI18n();
  const localePath = useNuxtLocalePath();
  const switchLocalePath = useNuxtSwitchLocalePath();
  const localeHead = useNuxtLocaleHead();

  return {
    ...vueI18n, // Includes t, locale, setLocale, etc.
    localePath, // For creating localized internal links
    switchLocalePath, // For building language switcher links
    localeHead, // For SEO head properties
  };
}
