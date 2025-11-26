import { watch } from 'vue';

export default defineNuxtPlugin(async (nuxtApp) => {
  // Get the i18n instance and auth
  const api = useApi();
  const i18n = nuxtApp.$i18n;

  // Get auth safely using the auth composable
  let auth;
  try {
    auth = nuxtApp.$auth || useAuth();
  } catch (e) {
    console.warn('[i18n] Auth not available during plugin initialization');
    auth = null;
  }

  // A set to keep track of which language messages have already been loaded
  const loadedLanguages = new Set<string>();

  /**
   * Loads translation messages for a given locale from the API.
   * @param {string} locale - The locale to load messages for (e.g., 'en', 'km').
   */
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

  /**
   * Sets the user's preferred language based on their profile data
   * --- THIS FUNCTION IS NOW DISABLED FOR KIOSK MODE ---
   */
  /*
  async function setUserLanguage() {
    try {
      // Check if auth is available and properly initialized
      if (!auth) {
        console.warn('[i18n] Auth not available for language setting')
        return
      }

      // Get auth status and data safely
      const authStatus = auth.status?.value || auth.loggedIn?.value
      const authData = auth.data?.value

      // Check if user is authenticated and has language preference
      if (authStatus === 'authenticated' || (authStatus === true && authData)) {
        const user = authData?.user || authData

        if (user) {
          // Check if user has a language preference (adjust property name as needed)
          const userLanguage = user.language || user.locale || user.lang || user.preferred_language

          if (userLanguage) {
            // Validate that the language is supported
            const supportedLocales = ['en', 'km', 'zh'] // From nuxt.config.ts
            const targetLocale = supportedLocales.includes(userLanguage) ? userLanguage : 'en'

            // Only change locale if it's different from current
            if (i18n.locale.value !== targetLocale) {
              console.log(`[i18n] Setting user language to: ${targetLocale}`)
              await loadLocaleMessages(targetLocale)
              await i18n.setLocale(targetLocale)
            }
          }
        }
      }
    }
    catch (error) {
      console.error('[i18n] Failed to set user language:', error)
    }
  }
  */

  // --- Main Logic ---

  // 1. Load messages for the initial locale when the app starts.
  await loadLocaleMessages(i18n.locale.value);

  // 2. Try to set user's preferred language if authenticated (with delay)
  // --- THIS LOGIC IS NOW DISABLED FOR KIOSK MODE ---
  /*
  if (import.meta.client) {
    // Wait a bit for auth to initialize properly
    setTimeout(async () => {
      await setUserLanguage()
    }, 500)

    // 3. Watch for authentication status changes if auth is available
    if (auth) {
      try {
        const statusToWatch = auth.status || auth.loggedIn
        if (statusToWatch) {
          watch(statusToWatch, async (newStatus) => {
            if (newStatus === 'authenticated' || newStatus === true) {
              await setUserLanguage()
            }
          })
        }
      } catch (e) {
        console.warn('[i18n] Could not watch auth status:', e)
      }
    }
  }
  */

  // 4. Watch for changes to the current locale.
  watch(i18n.locale, async (newLocale) => {
    await loadLocaleMessages(newLocale);
  });
});
