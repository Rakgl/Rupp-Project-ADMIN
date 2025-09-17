/**
 * Plugin to initialize user language on app startup
 * This runs after authentication is established
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  if (!import.meta.client)
    return

  const { $i18n } = nuxtApp
  let $auth

  try {
    $auth = nuxtApp.$auth || useAuth()
  }
  catch (e) {
    console.warn('[Language Init] Auth not available')
    return
  }

  // Function to initialize user language
  const initializeUserLanguage = async () => {
    try {
      if (!$auth)
        return

      const authStatus = $auth.status?.value || $auth.loggedIn?.value
      const authData = $auth.data?.value

      if ((authStatus === 'authenticated' || authStatus === true) && authData) {
        const user = authData.user || authData

        if (user) {
          // Check for user language preference (adjust field names as needed)
          const userLanguage = user.language || user.locale || user.lang || user.preferred_language

          if (userLanguage) {
            const supportedLocales = ['en', 'km', 'zh']
            const targetLocale = supportedLocales.includes(userLanguage) ? userLanguage : 'en'

            // Only change if different from current
            if ($i18n.locale.value !== targetLocale) {
              console.log(`[Language Init] Setting language to: ${targetLocale}`)
              await $i18n.setLocale(targetLocale)
            }
          }
        }
      }
    }
    catch (error) {
      console.error('[Language Init] Failed to initialize user language:', error)
    }
  }

  // Try multiple times with increasing delays to catch auth when it's ready
  const tryInitialize = async (attempt = 0) => {
    const maxAttempts = 5
    const delay = Math.min(200 * 1.5 ** attempt, 2000) // Exponential backoff, max 2s

    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      const authStatus = $auth?.status?.value || $auth?.loggedIn?.value

      if (authStatus === 'authenticated' || authStatus === true) {
        await initializeUserLanguage()
        return
      }

      // Try again if auth is still loading and we haven't hit max attempts
      if (attempt < maxAttempts) {
        await tryInitialize(attempt + 1)
      }
    }
    catch (error) {
      console.warn(`[Language Init] Attempt ${attempt + 1} failed:`, error)
      if (attempt < maxAttempts) {
        await tryInitialize(attempt + 1)
      }
    }
  }

  // Start trying to initialize
  await tryInitialize()
})
