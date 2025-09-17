export interface LanguageFontConfig {
  code: string;
  font: string;
  fallback?: string;
}

export const useLanguageFont = () => {
  // Language to font mapping - Optimized for EN and KM
  const languageFonts: Record<string, LanguageFontConfig> = {
    en: {
      code: 'en',
      font: 'font-sans',
      fallback: 'Parkinsans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    km: {
      code: 'km',
      font: 'font-khmer',
      fallback: 'Kantumruy Pro, "Khmer OS System", "Khmer OS", sans-serif',
    },
  };

  /**
   * Get font class for a specific language
   */
  const getFontClass = (languageCode: string): string => {
    const config = languageFonts[languageCode];
    return config?.font || languageFonts.en.font;
  };

  /**
   * Get font family CSS for a specific language
   */
  const getFontFamily = (languageCode: string): string => {
    const config = languageFonts[languageCode];
    return config?.fallback || languageFonts.en.fallback;
  };

  /**
   * Detect language from text content
   */
  const detectLanguage = (text: string): string => {
    if (!text) return 'en';

    // Khmer Unicode range (U+1780–U+17FF)
    if (/[\u1780-\u17FF]/.test(text)) return 'km';

    // Default to English for any other text
    return 'en';
  };

  /**
   * Get computed font class based on text content
   */
  const getComputedFontClass = (text: string): string => {
    const detectedLanguage = detectLanguage(text);
    return getFontClass(detectedLanguage);
  };

  /**
   * Get font config for multiple languages (for mixed content)
   */
  const getMultiLanguageFonts = (languages: string[]): LanguageFontConfig[] => {
    return languages.map((lang) => languageFonts[lang] || languageFonts.en);
  };

  /**
   * Generate CSS custom properties for all language fonts
   */
  const generateFontVariables = (): Record<string, string> => {
    const variables: Record<string, string> = {};

    Object.entries(languageFonts).forEach(([code, config]) => {
      variables[`--font-${code}`] = config.fallback;
    });

    return variables;
  };

  return {
    languageFonts,
    getFontClass,
    getFontFamily,
    detectLanguage,
    getComputedFontClass,
    getMultiLanguageFonts,
    generateFontVariables,
  };
};

/**
 * Vue directive for automatic language font detection
 */
export const vLanguageFont = {
  mounted(el: HTMLElement, binding: any) {
    const { getComputedFontClass } = useLanguageFont();
    const text = binding.value || el.textContent || '';
    const fontClass = getComputedFontClass(text);

    // Remove existing font classes
    el.classList.remove('font-sans', 'font-khmer');
    // Add the appropriate font class
    el.classList.add(fontClass);
  },
  updated(el: HTMLElement, binding: any) {
    const { getComputedFontClass } = useLanguageFont();
    const text = binding.value || el.textContent || '';
    const fontClass = getComputedFontClass(text);

    // Remove existing font classes
    el.classList.remove('font-sans', 'font-khmer');
    // Add the appropriate font class
    el.classList.add(fontClass);
  },
};
