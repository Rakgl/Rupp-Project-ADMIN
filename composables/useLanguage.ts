/**
 * Composable for managing user language preferences
 */
export const useLanguage = () => {
  const { $i18n, $auth } = useNuxtApp()
  const api = useApi()

  /**
   * Get the current user's language preference
   */
  const getCurrentUserLanguage = () => {
    try {
      if (!$auth) return 'en'

      const authStatus = $auth.status?.value || $auth.loggedIn?.value
      const authData = $auth.data?.value

      if ((authStatus === 'authenticated' || authStatus === true) && authData) {
        const user = authData.user || authData
        if (user) {
          return user.language || user.locale || user.lang || user.preferred_language || 'en'
        }
      }
    } catch (error) {
      console.warn('[Language] Error getting current user language:', error)
    }
    return 'en'
  }

  /**
   * Update user's language preference in the backend
   */
  const updateUserLanguage = async (language: string) => {
    try {
      if (!$auth) {
        console.warn('[Language] Auth not available for language update')
        return
      }

      const authStatus = $auth.status?.value || $auth.loggedIn?.value
      const authData = $auth.data?.value

      if (authStatus === 'authenticated' || (authStatus === true && authData)) {
        // Update user language preference via API
        await api('/user/language', {
          method: 'PUT',
          body: { language }
        })

        // Update local auth data if needed
        const user = authData?.user || authData
        if (user) {
          user.language = language
        }

        console.log(`[Language] User language preference updated to: ${language}`)
      }
    } catch (error) {
      console.error('[Language] Failed to update user language preference:', error)
      throw error
    }
  }

  /**
   * Change language and optionally save to user preferences
   */
  const setLanguage = async (language: string, saveToProfile = true) => {
    try {
      const supportedLocales = ['en', 'km']

      if (!supportedLocales.includes(language)) {
        console.warn(`[Language] Unsupported language: ${language}, defaulting to 'en'`)
        language = 'en'
      }

      // Change the app language
      await $i18n.setLocale(language)

      // Save to user profile if authenticated and requested
      if (saveToProfile && $auth) {
        const authStatus = $auth.status?.value || $auth.loggedIn?.value
        if (authStatus === 'authenticated' || authStatus === true) {
          await updateUserLanguage(language)
        }
      }

      console.log(`[Language] Language changed to: ${language}`)
    } catch (error) {
      console.error('[Language] Failed to set language:', error)
      throw error
    }
  }

  /**
   * Get available languages
   */
  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
    ]
  }

  /**
   * Get current language info
   */
  const getCurrentLanguage = () => {
    const currentCode = $i18n.locale.value
    const availableLanguages = getAvailableLanguages()
    return availableLanguages.find(lang => lang.code === currentCode) || availableLanguages[0]
  }

  return {
    getCurrentUserLanguage,
    updateUserLanguage,
    setLanguage,
    getAvailableLanguages,
    getCurrentLanguage,
  }
}