import { watch } from 'vue';

export default defineNuxtPlugin(async (nuxtApp) => {

  const api = useApi();
  const i18n = nuxtApp.$i18n;

  let auth;
  try {
    auth = nuxtApp.$auth || useAuth();
  } catch (e) {
    console.warn('[i18n] Auth not available during plugin initialization');
    auth = null;
  }

  const loadedLanguages = new Set<string>();

  async function loadLocaleMessages(locale: string) {
    if (loadedLanguages.has(locale)) {
      return;
    }
    try {
      const messages = await api(`/translations/${locale}`);
      i18n.setLocaleMessage(locale, messages);
      loadedLanguages.add(locale);
    } catch (error) {
      console.error(`[i18n] Failed to load messages for locale: ${locale}`, error);
    }
  }

  await loadLocaleMessages(i18n.locale.value);

  watch(i18n.locale, async (newLocale) => {
    await loadLocaleMessages(newLocale);
  });
});
