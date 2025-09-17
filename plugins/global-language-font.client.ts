/**
 * Simple global language font system
 */

export default defineNuxtPlugin((nuxtApp) => {
  // Register global directive for auto font detection
  nuxtApp.vueApp.directive('auto-font', {
    mounted(el: HTMLElement, binding: any) {
      const text = binding.value || el.textContent || ''

      // Auto-detect and apply font
      if (/[\u1780-\u17FF]/.test(text)) {
        el.classList.add('auto-khmer')
      }
      else {
        el.classList.add('auto-english')
      }
    },
    updated(el: HTMLElement, binding: any) {
      const text = binding.value || el.textContent || ''

      // Remove existing classes
      el.classList.remove('auto-khmer', 'auto-english')

      // Auto-detect and apply font
      if (/[\u1780-\u17FF]/.test(text)) {
        el.classList.add('auto-khmer')
      }
      else {
        el.classList.add('auto-english')
      }
    },
  })
})
