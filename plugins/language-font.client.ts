/**
 * Plugin to register the language font directive globally
 */

export default defineNuxtPlugin((nuxtApp) => {
  // Register the language font directive
  nuxtApp.vueApp.directive('language-font', {
    mounted(el: HTMLElement, binding: any) {
      const { getComputedFontClass } = useLanguageFont()
      const text = binding.value || el.textContent || ''
      const fontClass = getComputedFontClass(text)

      // Remove existing font classes
      el.classList.remove(
        'font-sans',
        'font-khmer',
        'font-arabic',
        'font-chinese',
        'font-japanese',
        'font-thai',
        'font-inter',
      )
      // Add the appropriate font class
      el.classList.add(fontClass)
    },
    updated(el: HTMLElement, binding: any) {
      const { getComputedFontClass } = useLanguageFont()
      const text = binding.value || el.textContent || ''
      const fontClass = getComputedFontClass(text)

      // Remove existing font classes
      el.classList.remove(
        'font-sans',
        'font-khmer',
        'font-arabic',
        'font-chinese',
        'font-japanese',
        'font-thai',
        'font-inter',
      )
      // Add the appropriate font class
      el.classList.add(fontClass)
    },
  })
})
